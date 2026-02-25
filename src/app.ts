import { Hono } from "hono";

import importedRentalData from "../output.json" with { type: "json" };
import type { Result } from "./types/processedData.ts";
import type { NominatimPlace } from "./types/nominatim.ts";
import { getDisplayName, nominatimFetch } from "./utils.ts";

const rentalData = importedRentalData as Result;

const app = new Hono();

app.get("/", async (c) => {
  const q = c.req.query("q");

  if (!q) {
    return c.text("missing `q` query param", 400);
  }

  const res = await nominatimFetch(q);

  if (!res.ok) {
    const text = await res.text();
    // todo: better error handling
    return c.text(`issue hitting nominatim api: ${text}`, 500);
  }

  // todo: better error handling
  const json = (await res.json()) as NominatimPlace[];

  const filtered = json.filter((x) => x.place_rank === 30);

  if (filtered.length === 0) {
    return c.text("no actual address found", 400);
  }

  if (filtered.some((x) => getDisplayName(x) !== getDisplayName(filtered[0]))) {
    return c.text(
      `‼️ conflicting display addresses: ${JSON.stringify(filtered)}`,
      400,
    );
  }

  const found = Object.values(rentalData).find((val) => {
    return val.nominatim.address === getDisplayName(filtered[0]);
  });

  if (!found) {
    return c.text("no match found", 400);
  }

  return c.json(found.opendata);
});

export default app;
