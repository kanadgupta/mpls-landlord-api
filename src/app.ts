import { Hono } from "hono";

import importedRentalData from "../output.json" with { type: "json" };
import type { Result, SuccessResult } from "./types/processedData.ts";
import type { NominatimPlace } from "./types/nominatim.ts";
import { getDisplayName, nominatimFetch } from "./utils.ts";
import { validator } from "hono/validator";

const rentalData = importedRentalData as Result;

const app = new Hono();

const validate = validator("query", (val, c) => {
  const q = val["q"];
  return q && typeof q === "string"
    ? { q }
    : c.text("missing `q` query param", 400);
});

app.get("/", validate, async (c) => {
  const { q } = c.req.valid("query");

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
    return val.success && val.nominatim.address === getDisplayName(filtered[0]);
  }) as SuccessResult;

  if (!found) {
    return c.text("no match found", 400);
  }

  return c.json(found.opendata);
});

export default app;
