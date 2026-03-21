/**
 * Properties contained within the active rental license data.
 *
 * Might not be exhaustive (and would be nice if we could autogenerate this)
 */
export interface RentalProps {
  // the important ones
  licensedUnits: number;
  // todo: this might not be an exhaustive list, might need zod or something else for stricter validation
  milestone: "Active" | "Closed" | "Delinquent" | "Fees" | "License Re";
  // todo: this might not be an exhaustive list, might need zod or something else for stricter validation
  tier: "Tier 1" | "Tier 2" | "Tier 3" | null;

  apn: string | null;
  OBJECTID: 1;
  licenseNumber: string;
  category: string;
  status: string;
  issueDate: string;
  expirationDate: string;
  address: string;
  ownerName: string | null;
  ownerAddress1: string | null;
  ownerAddress2: string | null;
  ownerCity: string | null;
  ownerState: string | null;
  ownerZip: string | null;
  ownerPhone: string | null;
  ownerEmail: string | null;
  applicantName: string;
  applicantAddress1: string | null;
  applicantAddress2: string | null;
  applicantCity: string | null;
  applicantState: string | null;
  applicantZip: string | null;
  applicantPhone: string | null;
  applicantEmail: string | null;
  ward: string | null;
  neighborhoodDesc: string | null;
  communityDesc: string | null;
  policePrecinct: string | null;
  // todo: this might not be an exhaustive list, might need zod or something else for stricter validation
  shortTermRental: "Yes" | "No";
  latitude: number;
  longitude: number;
  xWebMercator: number;
  yWebMercator: number;
}
