import nock from "nock";
import { describe, expect, it } from "vitest";

import app from "../src/app.ts";
import { nominatimBaseUrl } from "../src/utils.ts";

describe("app tests", () => {
  it("should return 400 if no query param is passed", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(400);
  });

  it("should return 400 if no results are found", async () => {
    const q = "123 main st";
    nock(nominatimBaseUrl, {
      encodedQueryParams: true,
    })
      .get("/search")
      .query({ q, format: "json", addressdetails: "1" })
      .reply(200, []);

    const search = new URLSearchParams({ q }).toString();

    const res = await app.request(`/?${search}`);

    expect(res.status).toBe(400);
  });
});
