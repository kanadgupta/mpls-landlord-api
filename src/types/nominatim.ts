// todo: this might be a little too prescriptive and may need tweaking
// https://nominatim.org/release-docs/latest/api/Output/#json
export type NominatimPlace = {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  class: string;
  type: string;
  // https://nominatim.org/release-docs/latest/customize/Ranking/#address-rank
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  // only present if `addressdetails` query param is set to `1`
  // https://nominatim.org/release-docs/latest/api/Search/#output-details
  address: {
    house_number: string;
    road: string;
    neighbourhood: string;
    suburb: string;
    city: string;
    county: string;
    postcode: string;
    country: string;
    country_code: string;
  };
  boundingbox: [number, number, number, number];
};
