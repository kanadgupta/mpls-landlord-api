import type { FeatureCollection, Point } from "geojson";

export type PeliasProperties = {
  id: string;
  /**
   * @see {@link https://github.com/pelias/documentation/blob/a4650408d8b98f19a64d8a10f1bcbd541985b153/response.md#gid}
   */
  gid: string;
  layer?: "address" | {};
  source?: string;
  souce_id?: string;
  /**
   * @see {@link https://github.com/pelias/documentation/blob/a4650408d8b98f19a64d8a10f1bcbd541985b153/response.md#name}
   */
  name: string;
  /**
   * @see {@link https://github.com/pelias/documentation/blob/a4650408d8b98f19a64d8a10f1bcbd541985b153/response.md#confidence}
   */
  confidence: number;
  country?: string;
  country_gid?: string;
  country_a?: string;
  macroregion?: string;
  macroregion_gid?: string;
  region?: string;
  region_gid?: string;
  locality?: string;
  locality_gid?: string;
  /**
   * @see {@link https://github.com/pelias/documentation/blob/a4650408d8b98f19a64d8a10f1bcbd541985b153/response.md#label}
   */
  label: string;
  /**
   * @see {@link https://github.com/pelias/documentation/blob/a4650408d8b98f19a64d8a10f1bcbd541985b153/result_quality.md#match_type}
   * @see {@link https://github.com/pelias/documentation/blob/a4650408d8b98f19a64d8a10f1bcbd541985b153/addresses.md#accuracy-in-address-results}
   */
  match_type?: "exact" | "interpolated" | "fallback";
  /**
   * @see {@link https://github.com/pelias/documentation/blob/a4650408d8b98f19a64d8a10f1bcbd541985b153/result_quality.md#accuracy}
   * @see {@link https://github.com/pelias/documentation/blob/a4650408d8b98f19a64d8a10f1bcbd541985b153/addresses.md#accuracy-in-address-results}
   */
  accuracy?: "point" | "centroid";
};

export interface PeliasResponse extends FeatureCollection<
  Point,
  PeliasProperties
> {}
