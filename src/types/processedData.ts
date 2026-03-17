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
      ward: string;
      neighborhood: string;
      community: string;
      precinct: string;
      latitude: number;
      longitude: number;
    };
    applicant: {
      address: string | null;
      email: string;
      name: string;
      phone: string;
      state: string;
      zip: string;
    };
    owner: {
      address: string;
      email: string;
      name: string;
      phone: string;
      state: string;
      zip: string;
    };
  };
  nominatim: NominatimAggregateResult;
  success: true;
};

type ErrorResult = { error: { message: string }; success: false };
