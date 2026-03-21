import type { RentalProps } from "./rentalProps.ts";

export type PeliasRecord = {
  address: string;
  /**
   * stored purely for debugging purposes, we should not be matching based on this value.
   * @see {@link https://github.com/pelias/documentation/blob/a4650408d8b98f19a64d8a10f1bcbd541985b153/response.md#gid}
   */
  gid: string;
};

export type Result = Record<string, SuccessResult | ErrorResult>;

export type SuccessResult = {
  opendata: RentalProps;
  pelias: PeliasRecord;
  success: true;
};

type ErrorResult = { error: { message: string }; success: false };
