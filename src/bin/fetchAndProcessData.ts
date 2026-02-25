import { createHash } from "node:crypto";
import type { FeatureCollection, Point } from "geojson";
import type { RentalProps } from "../types/rentalProps.ts";
import type {
  NominatimAggregateResult,
  Result,
} from "../types/processedData.ts";
import type { NominatimPlace } from "../types/nominatim.ts";
import { getDisplayName, nominatimFetch } from "../utils.ts";

const apiUrl =
  "https://opendata.arcgis.com/api/v3/datasets/baf5f14d67704668884275686e3db867_0/downloads/data?format=geojson&spatialRefId=4326&where=1%3D1";

/**
 * Fetches the active rental license data and processes it with nominatim.
 */
export async function fetchAndProcessData() {
  const result: Result = {};
  const body = await fetch(apiUrl);
  const data = (await body.json()) as FeatureCollection<Point, RentalProps>;
  await Promise.all(
    // todo: chunk this out properly so requests are properly batched
    data.features
      // todo: remove this
      .slice(0, 200)
      .map(async (entry) => {
        let hashedAddress: string = createHash("sha256")
          .update(entry.properties.address)
          .digest("hex");

        const res = await nominatimFetch(
          `${entry.properties.address}, Minneapolis`,
        );

        if (!res.ok) {
          console.error(
            `‼️ received ${res.status} with this address: ${entry.properties.address}`,
          );
          return Promise.resolve();
        }

        const json = (await res.json()) as NominatimPlace[];

        const filtered = json.filter((x) => x.place_rank === 30);

        if (filtered.length === 0) {
          console.error(
            `‼️ no full results for this address: ${entry.properties.address}, ${JSON.stringify(json)}`,
          );
          return Promise.resolve();
        }

        if (
          filtered.some(
            (x) => getDisplayName(x) !== getDisplayName(filtered[0]),
          )
        ) {
          console.error(
            `‼️ multiple display addresses for this address: ${entry.properties.address}, ${JSON.stringify(json)}`,
          );
          return Promise.resolve();
        }

        const singleResult = filtered.reduce<NominatimAggregateResult>(
          (prev, curr) => {
            prev.osm_ids.push(curr.osm_id);
            prev.place_ids.push(curr.place_id);
            return prev;
          },
          {
            address: getDisplayName(filtered[0]),
            osm_ids: [],
            place_ids: [],
          },
        );

        if (singleResult.osm_ids.length !== 1) {
          console.warn(
            `‼️ multiple OSM results for this address: ${entry.properties.address}, ${JSON.stringify(json)}`,
          );
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
          nominatim: singleResult,
        };
      }),
  );
  console.log(JSON.stringify(result, null, 2));
}

fetchAndProcessData();
