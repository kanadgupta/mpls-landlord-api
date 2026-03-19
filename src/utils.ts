import pkg from "../package.json" with { type: "json" };
import type { NominatimPlace } from "./types/nominatim.ts";

export const nominatimBaseUrl =
  process.env.NOMINATIM_BASE_URL || "https://nominatim.openstreetmap.org";

export async function nominatimFetch(
  q: string,
  /**
   * https://nominatim.org/release-docs/latest/api/Search/#result-restriction:~:text=Boost%20parameter%20which%20focuses%20the%20search%20on%20the%20given%20area
   */
  viewbox?: [number, number, number, number],
) {
  const search = new URLSearchParams({
    q,
    format: "json",
    addressdetails: "1",
  });

  if (viewbox) {
    search.set("viewbox", viewbox.join(","));
  }

  return fetch(`${nominatimBaseUrl}/search?${search.toString()}`, {
    // user agent is set to comply with nominatim usage policy
    // https://operations.osmfoundation.org/policies/nominatim/
    headers: { "user-agent": `mpls-landlord-api/${pkg.version}` },
  });
}

export function getNominatimDisplayName(input: NominatimPlace): string {
  // todo: might be worth reinvestigating this once i figure out how to
  // include the state in the nominatim responses (might require zip code data?)
  return `${input.address.house_number} ${input.address.road}, ${input.address.city}, ${input.address.postcode}`;
}
