import { serve } from "@hono/node-server";
import app from "./app.ts";

const port = 3000;

serve({
  fetch: app.fetch,
  port,
});

console.log(`running at http://localhost:${port}`);
