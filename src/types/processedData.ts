export type NominatimAggregateResult = {
  address: string;
  osm_ids: number[];
  place_ids: number[];
};

export type Result = Record<string, SuccessResult | ErrorResult>;

export type SuccessResult = {
  opendata: {
    property: {
      address: string;
      ward: string | null;
      neighborhood: string | null;
      community: string | null;
      precinct: string | null;
      latitude: number;
      longitude: number;
    };
    applicant: {
      address: string | null;
      email: string | null;
      name: string | null;
      phone: string | null;
      state: string | null;
      zip: string | null;
    };
    owner: {
      address: string | null;
      email: string | null;
      name: string | null;
      phone: string | null;
      state: string | null;
      zip: string | null;
    };
  };
  nominatim: NominatimAggregateResult;
  success: true;
};

type ErrorResult = { error: { message: string }; success: false };
