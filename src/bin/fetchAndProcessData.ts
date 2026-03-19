import { createHash } from "node:crypto";
import fs from "node:fs/promises";

import type { Feature, FeatureCollection, Point } from "geojson";
import * as d3 from "d3-dsv";

import type { RentalProps } from "../types/rentalProps.ts";
import type { Result } from "../types/processedData.ts";
import {
  filterForAddresses,
  getPeliasDisplayName,
  peliasStructuredSearch,
} from "../utils.ts";
import type { PeliasProperties, PeliasResponse } from "../types/pelias.ts";

const apiUrl =
  "https://opendata.arcgis.com/api/v3/datasets/baf5f14d67704668884275686e3db867_0/downloads/data?format=geojson&spatialRefId=4326&where=1%3D1";

const inputFile = "src/data/rentals-input.json" as const;
const outputFile = "src/data/rentals-output-pelias.json" as const;
const summaryFile = "src/data/rentals-output-pelias-summary.json" as const;
const csvReportFile = "src/data/rentals-output-pelias-errors.csv" as const;

/** CSV rows */
const row = [
  "address",
  "errorType",
  "confidence",
  "match_type",
  "accuracy",
  "layer",
  "message",
] as const;

async function fetchData(
  refresh = true,
): Promise<FeatureCollection<Point, RentalProps>> {
  if (refresh) {
    const body = await fetch(apiUrl);
    const data = await body.text();
    await fs.writeFile(inputFile, data, { encoding: "utf-8" });
    const parsed = JSON.parse(data);
    console.log("📦 successfully fetched rental data");
    return parsed;
  } else {
    const data = JSON.parse(
      await fs.readFile(inputFile, { encoding: "utf-8" }),
    );
    console.log("💤 using cached rental data");
    return data;
  }
}

/**
 * Fetches the active rental license data and processes it with pelias.
 */
export async function fetchAndProcessData() {
  const result: Result = {};

  const summary = {
    success: {
      oneMatch: 0,
      multipleMatches: 0,
    },
    failed: {
      noFullResults: 0,
      multipleDisplayAddresses: 0,
    },
  };

  // todo: make this a CLI flag
  const data = await fetchData(false);

  const splitLength = 1000;

  await fs.writeFile(csvReportFile, `${d3.csvFormatRow(row)}\n`, {
    encoding: "utf-8",
  });

  console.log("# of properties:", data.features.length);

  const handleError = async (
    address: string,
    hashedAddress: string,
    errorType: keyof (typeof summary)["failed"],
    message: string,
    confidence?: PeliasProperties["confidence"],
    match_type?: PeliasProperties["match_type"],
    accuracy?: PeliasProperties["accuracy"],
    layer?: PeliasProperties["layer"],
  ) => {
    console.error(message);
    result[hashedAddress] = { error: { message }, success: false };
    summary.failed[errorType] = summary.failed[errorType] + 1;
    await fs.appendFile(
      csvReportFile,
      `${d3.csvFormatBody([{ address, errorType, message, confidence, match_type, accuracy, layer }], row)}\n`,
      {
        encoding: "utf-8",
      },
    );
  };

  const fetchAndParse = async (
    address: string,
    unresolved: () => Promise<Response>,
  ): Promise<PeliasResponse> => {
    const res = await unresolved().catch((e) => {
      console.error(
        `‼️ failed to fetch for this address: ${address} — server is likely down!`,
      );
      throw e;
    });

    const text = await res.text();

    if (!res.ok) {
      throw new Error(
        `‼️ failed to fetch for this address: ${address} — received ${res.status} with text: ${text}`,
      );
    }

    let json: PeliasResponse;

    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(
        `‼️ failed to parse JSON this address: ${address}: ${text}`,
      );
    }

    return json;
  };

  const splitData = data.features
    .reduce<Feature<Point, RentalProps>[][]>((prev, current, i) => {
      // splits the features into chunks of splitLength
      if (i % splitLength === 0) {
        prev.push([current]);
      } else {
        if (prev[prev.length - 1]) {
          prev[prev.length - 1].push(current);
        } else {
          prev.push([current]);
        }
      }
      return prev;
    }, [])
    .map((outer) => {
      return outer.map((entry) => {
        // function that initiates fetch when resolved
        const res = () =>
          peliasStructuredSearch({ address: entry.properties.address });
        return [entry, res] as const;
      });
    });

  for (const chunk of splitData) {
    for (const [entry, unresolvedRes] of chunk) {
      let hashedAddress: string = createHash("sha256")
        .update(entry.properties.address)
        .digest("hex");

      let json = (await fetchAndParse(entry.properties.address, unresolvedRes))
        .features;

      let filtered = json.filter(filterForAddresses);

      if (filtered.length === 0) {
        let updatedAddress = entry.properties.address;
        // reattempt fetch, but replace unit numbers like "#1A" with "Apt 1A"
        const regex = /( #)(?<unit>[A-z,0-9,-]+$)/;
        const match = updatedAddress.match(regex);
        const unit = match?.groups?.unit;
        if (unit) {
          updatedAddress = updatedAddress.replace(regex, ` Apt ${unit}`);

          const unresolvedReattemptRes = () =>
            peliasStructuredSearch({ address: updatedAddress });

          json = (await fetchAndParse(updatedAddress, unresolvedReattemptRes))
            .features;

          filtered = json.filter(filterForAddresses);
        }

        if (filtered.length === 0) {
          await handleError(
            updatedAddress,
            hashedAddress,
            "noFullResults",
            `‼️ no full results for this address: ${updatedAddress}, ${JSON.stringify(json)}`,
            json[0]?.properties.confidence,
            json[0]?.properties.match_type,
            json[0]?.properties.accuracy,
            json[0]?.properties.layer,
          );

          continue;
        }
      }

      result[hashedAddress] = {
        opendata: {
          property: {
            address: entry.properties.address,
            ward: entry.properties.ward,
            neighborhood: entry.properties.neighborhoodDesc,
            community: entry.properties.communityDesc,
            precinct: entry.properties.policePrecinct,
            latitude: entry.properties.latitude,
            longitude: entry.properties.longitude,
          },
          applicant: {
            address: entry.properties.applicantAddress1
              ? entry.properties.applicantAddress1
              : entry.properties.applicantAddress2,
            email: entry.properties.applicantEmail,
            name: entry.properties.applicantName,
            phone: entry.properties.applicantPhone,
            state: entry.properties.applicantState,
            zip: entry.properties.applicantZip,
          },
          owner: {
            address: entry.properties.ownerAddress1,
            email: entry.properties.ownerEmail,
            name: entry.properties.ownerName,
            phone: entry.properties.ownerPhone,
            state: entry.properties.ownerState,
            zip: entry.properties.ownerZip,
          },
        },
        pelias: {
          address: getPeliasDisplayName(filtered[0]),
          gid: filtered[0].properties.gid,
        },
        success: true,
      };

      console.log(
        `✅ successfully added output for ${entry.properties.address}`,
      );
      summary.success.oneMatch = summary.success.oneMatch + 1;
    }
    // await new Promise((r) => setTimeout(r, 1000));
  }

  // todo: summary stats
  // todo: CLI flag for writing vs not?
  // todo: should we write each line? maybe as JSONL?
  await fs.writeFile(outputFile, JSON.stringify(result, null, 2), {
    encoding: "utf-8",
  });

  console.log("🎊 done");
  console.log("summary", JSON.stringify(summary));

  await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2), {
    encoding: "utf-8",
  });
}

fetchAndProcessData().then(() => {
  process.exit(0);
});
