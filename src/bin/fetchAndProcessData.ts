import { createHash } from "node:crypto";
import fs from "node:fs/promises";

import type { Feature, FeatureCollection, Point } from "geojson";
import * as d3 from "d3-dsv";

import type { RentalProps } from "../types/rentalProps.ts";
import type {
  NominatimAggregateResult,
  Result,
} from "../types/processedData.ts";
import type { NominatimPlace } from "../types/nominatim.ts";
import { getNominatimDisplayName, nominatimFetch } from "../utils.ts";

const apiUrl =
  "https://opendata.arcgis.com/api/v3/datasets/baf5f14d67704668884275686e3db867_0/downloads/data?format=geojson&spatialRefId=4326&where=1%3D1";

const inputFile = "src/data/rentals-input.json" as const;
const outputFile = "src/data/rentals-output-nominatim.json" as const;
const summaryFile = "src/data/rentals-output-nominatim-summary.json" as const;
const csvReportFile = "src/data/rentals-output-nominatim-errors.csv" as const;

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
 * Fetches the active rental license data and processes it with nominatim.
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
  const data = await fetchData();

  const splitLength = 1000;

  await fs.writeFile(
    csvReportFile,
    `${d3.csvFormatRow(["address", "errortype", "results"])}\n`,
    { encoding: "utf-8" },
  );

  console.log("# of properties:", data.features.length);

  const handleError = async (
    address: string,
    hashedAddress: string,
    errorType: keyof (typeof summary)["failed"],
    message: string,
  ) => {
    console.error(message);
    result[hashedAddress] = { error: { message }, success: false };
    summary.failed[errorType] = summary.failed[errorType] + 1;
    await fs.appendFile(
      csvReportFile,
      `${d3.csvFormatRow([address, errorType, message])}\n`,
      {
        encoding: "utf-8",
      },
    );
  };

  const fetchAndParse = async (
    address: string,
    unresolved: () => Promise<Response>,
  ): Promise<NominatimPlace[]> => {
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

    let json: NominatimPlace[] = [];

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
          nominatimFetch(`${entry.properties.address}, Minneapolis`);
        return [entry, res] as const;
      });
    });

  for (const chunk of splitData) {
    for (const [entry, unresolvedRes] of chunk) {
      let hashedAddress: string = createHash("sha256")
        .update(entry.properties.address)
        .digest("hex");

      let json = await fetchAndParse(entry.properties.address, unresolvedRes);

      let filtered = json.filter((x) => x.place_rank === 30);

      if (filtered.length === 0) {
        let updatedAddress = entry.properties.address;
        // reattempt fetch, but with unit numbers stripped out
        if (json.length === 0 && updatedAddress.includes(" #")) {
          updatedAddress = updatedAddress.replace(/ #.*/, "");

          const unresolvedReattemptRes = () =>
            nominatimFetch(`${updatedAddress}, Minneapolis`);

          json = await fetchAndParse(updatedAddress, unresolvedReattemptRes);

          filtered = json.filter((x) => x.place_rank === 30);
        }

        if (filtered.length === 0) {
          await handleError(
            updatedAddress,
            hashedAddress,
            "noFullResults",
            `‼️ no full results for this address: ${updatedAddress}, ${JSON.stringify(json)}`,
          );

          continue;
        }
      }

      if (
        filtered.some(
          (x) =>
            getNominatimDisplayName(x) !== getNominatimDisplayName(filtered[0]),
        )
      ) {
        await handleError(
          entry.properties.address,
          hashedAddress,
          "multipleDisplayAddresses",
          `‼️ multiple display addresses for this address: ${entry.properties.address}, ${JSON.stringify(json)}`,
        );

        continue;
      }

      const singleResult = filtered.reduce<NominatimAggregateResult>(
        (prev, curr) => {
          prev.osm_ids.push(curr.osm_id);
          prev.place_ids.push(curr.place_id);
          return prev;
        },
        {
          address: getNominatimDisplayName(filtered[0]),
          osm_ids: [],
          place_ids: [],
        },
      );

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
        nominatim: singleResult,
        success: true,
      };

      if (singleResult.osm_ids.length !== 1) {
        console.warn(
          `⚠️ multiple OSM results for this address: ${entry.properties.address}, ${JSON.stringify(json)}`,
        );
        summary.success.multipleMatches = summary.success.multipleMatches + 1;
      } else {
        console.log(
          `✅ successfully added output for ${entry.properties.address}`,
        );
        summary.success.oneMatch = summary.success.oneMatch + 1;
      }
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
