import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDatabase, type TestDatabase } from "./pg.js";

const hasAdminUrl = Boolean(process.env.TEST_DATABASE_ADMIN_URL);
if (!hasAdminUrl) {
  console.info("Skipping PostGIS smoke test: set TEST_DATABASE_ADMIN_URL to enable it.");
}

describe.skipIf(!hasAdminUrl)("native PostGIS", () => {
  let database: TestDatabase | undefined;

  beforeAll(async () => {
    database = await createTestDatabase();
  });

  afterAll(async () => {
    await database?.drop();
  });

  it("creates a throwaway database with PostGIS and drops it after the run", async () => {
    if (!database) {
      throw new Error("Throwaway Postgres test database was not initialized.");
    }
    const client = new Client({ connectionString: database.databaseUrl });
    try {
      await client.connect();
      const result = await client.query<{ postgis_version: string }>("SELECT postgis_version()");
      expect(result.rows[0]?.postgis_version).toBeTruthy();
    } finally {
      await client.end();
    }
  });
});
