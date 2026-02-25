import { expect, it } from "vitest";
import app from "../src/app.ts";

it("should return 400 if no query param is passed", async () => {
  const res = await app.request("/");
  expect(res.status).toBe(400);
});
