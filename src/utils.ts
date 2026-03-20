import type { Feature, Point } from "geojson";
import type { PeliasProperties, PeliasResponse } from "./types/pelias.ts";

export const peliasBaseUrl =
  process.env.PELIAS_BASE_URL || "https://api.geocode.earth";

type FetchResponse = Promise<{
  original: PeliasResponse;
  filtered: Feature<Point, PeliasProperties>[];
}>;

/**
 * filter pelias results for valid addresses
 */
const filterForAddresses = (
  feat: Feature<Point, PeliasProperties>,
): boolean => {
  return (
    feat.properties.confidence === 1 ||
    // this is a bit excessive and we could probably just filter for `layer === "address"`,
    // but we're being extra cautious here.
    //
    // one thing to note is that even with these filters, i've noticed inaccurate geocoding results
    // (e.g., the lat/long is off for 907 OLIVER AVE N) even though the address is formatted properly.
    // since we're focused on cleaning up the addresses and less focused on the geocoding accuracy,
    // i think this is fine for now, especially since our geocoding source of truth is the same
    // across the board.
    (feat.properties.layer === "address" &&
      feat.properties.accuracy === "point" &&
      feat.properties.match_type === "interpolated" &&
      feat.properties.confidence >= 0.8)
  );
};

/**
 * performs the structured search fetch request, parses the response,
 * filters the results, and returns both the original and filtered results.
 */
const fetchAndParse = async (search: URLSearchParams): FetchResponse => {
  const address = search.get("address");

  if (!address) throw new Error("no address passed");

  const res = await fetch(
    `${peliasBaseUrl}/v1/search/structured?${search.toString()}`,
  ).catch((e) => {
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

  let original: PeliasResponse;

  try {
    original = JSON.parse(text);
    // todo: might be good to do a zod-like type-validating parsing here?
  } catch {
    throw new Error(
      `‼️ failed to parse JSON this address: ${address}: ${text}`,
    );
  }

  const filtered = original.features.filter(filterForAddresses);

  return { original, filtered };
};

/**
 * {@see @link https://github.com/pelias/documentation/blob/a4650408d8b98f19a64d8a10f1bcbd541985b153/structured-geocoding.md}
 */
export async function peliasStructuredSearch(address: string): FetchResponse {
  const search = new URLSearchParams({
    address,
    locality: "Minneapolis",
    size: "1",
    sources: "osm",
  });

  let { filtered, original } = await fetchAndParse(search);

  // todo: at some point before or after eliminating the `sources` filter,
  // we should do that hash string replacement. may need to play around to see which yields better results!
  if (!filtered.length) {
    // if no proper results were found, widen the search by removing the `sources` filter
    // see: https://github.com/pelias/documentation/blob/a4650408d8b98f19a64d8a10f1bcbd541985b153/search.md#filter-by-data-source
    search.delete("sources");
    const retry = await fetchAndParse(search);

    filtered = retry.filtered;
    original = retry.original;
  }

  return { filtered, original };
}

export function getPeliasDisplayName(
  input: Feature<Point, PeliasProperties>,
): string {
  return input.properties.label;
}
