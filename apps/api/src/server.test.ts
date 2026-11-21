import { expect, it } from "vitest";
import { buildServer } from "./server.js";

it("returns a healthy response from GET /healthz", async () => {
  const server = buildServer();
  try {
    const response = await server.inject({ method: "GET", url: "/healthz" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  } finally {
    await server.close();
  }
});
