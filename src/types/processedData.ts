export type NominatimAggregateResult = {
  address: string;
  osm_ids: number[];
  place_ids: number[];
};

export type Result = Record<
  string,
  {
    opendata: {
      property: Record<string, null | number | string>;
      applicant: Record<string, null | number | string>;
      owner: Record<string, null | number | string>;
    };
    nominatim: NominatimAggregateResult;
  }
>;
