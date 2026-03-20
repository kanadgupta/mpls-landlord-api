import { Hono } from "hono";
import { validator } from "hono/validator";

// @ts-ignore this file is massive so we're preventing `tsc` from attempting to type it
import processedRentalData from "./data/rentals-output-pelias.json" with { type: "json" };
import type { Result, SuccessResult } from "./types/processedData.ts";
import { getPeliasDisplayName, peliasStructuredSearch } from "./utils.ts";

const rentalData = processedRentalData as Result;

const app = new Hono();

const validate = validator("query", (val, c) => {
  const address = val["address"];
  return address && typeof address === "string"
    ? { address }
    : c.text("missing `address` query param", 400);
});

const route = app.get("/", validate, async (c) => {
  const { address } = c.req.valid("query");

  const { filtered } = await peliasStructuredSearch(address);

  if (filtered.length === 0) {
    return c.text("no actual address found", 400);
  }

  if (
    filtered.some(
      (x) => getPeliasDisplayName(x) !== getPeliasDisplayName(filtered[0]),
    )
  ) {
    return c.text(
      `‼️ conflicting display addresses: ${JSON.stringify(filtered)}`,
      400,
    );
  }

  const found = Object.values(rentalData).find((val) => {
    return (
      val.success && val.pelias.address === getPeliasDisplayName(filtered[0])
    );
  }) as SuccessResult;

  if (!found) {
    return c.text("no match found", 400);
  }

  return c.json(found.opendata);
});

export default app;

export type AppType = typeof route;
