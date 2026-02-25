export interface RentalProps {
  // the important ones
  licensedUnits: number;
  milestone: "Active" | "Delinquent" | string;
  tier: "Tier 1" | "Tier 2" | "Tier 3";

  apn: string;
  OBJECTID: 1;
  licenseNumber: string;
  category: string;
  status: string;
  issueDate: string;
  expirationDate: string;
  address: string;
  ownerName: string;
  ownerAddress1: string;
  ownerAddress2: string | null;
  ownerCity: string;
  ownerState: string;
  ownerZip: string;
  ownerPhone: string;
  ownerEmail: string;
  applicantName: string;
  applicantAddress1: string;
  applicantAddress2: string | null;
  applicantCity: string;
  applicantState: string;
  applicantZip: string;
  applicantPhone: string;
  applicantEmail: string;
  ward: string;
  neighborhoodDesc: string;
  communityDesc: string;
  policePrecinct: string;
  shortTermRental: "Yes" | "No";
  latitude: number;
  longitude: number;
  xWebMercator: number;
  yWebMercator: number;

  // new property that we add
  nominatim: {
    address: string;
    osm_id: number[];
    place_id: number[];
  };
}
