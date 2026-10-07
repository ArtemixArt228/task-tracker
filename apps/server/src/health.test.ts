import { describe, expect, test } from "bun:test";

import app from "./index";

describe("GET /health", () => {
  test("reports ok with a live database", async () => {
    const res = await app.request("/health");

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: "ok", db: "ok" });
  });
});
