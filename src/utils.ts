import type { Feature, Point } from "geojson";
import type { PeliasProperties } from "./types/pelias.ts";

export const peliasBaseUrl =
  process.env.PELIAS_BASE_URL || "https://api.geocode.earth";

/**
 * filter pelias results for valid addresses
 */
export const filterForAddresses = (
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
 * {@see @link https://github.com/pelias/documentation/blob/a4650408d8b98f19a64d8a10f1bcbd541985b153/structured-geocoding.md}
 */
export async function peliasStructuredSearch(
  opts: {
    address: string;
    neighbourhood?: string;
    borough?: string;
    locality?: string;
    county?: string;
    region?: string;
    postalcode?: string;
    country?: string;
  },
  /**
   * @see {@link https://github.com/pelias/documentation/blob/a4650408d8b98f19a64d8a10f1bcbd541985b153/search.md#search-within-a-circular-region}
   */
  coordinates?: { lat: number; long: number },
) {
  const search = new URLSearchParams({
    locality: "Minneapolis",
    size: "1",
    ...opts,
  });

  if (coordinates) {
    search.set("boundary.circle.lat", String(coordinates.lat));
    search.set("boundary.circle.lon", String(coordinates.long));
    search.set("boundary.circle.radius", "1");
  }

  return fetch(`${peliasBaseUrl}/v1/search/structured?${search.toString()}`);
}

export function getPeliasDisplayName(
  input: Feature<Point, PeliasProperties>,
): string {
  return input.properties.label;
}
