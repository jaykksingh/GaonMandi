import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDatabase, type TestDatabase } from "./pg.js";

it("rejects remote admin URLs before connecting", async () => {
  const originalAdminUrl = process.env.TEST_DATABASE_ADMIN_URL;
  process.env.TEST_DATABASE_ADMIN_URL = "postgres://postgres:password@db.example.com/postgres";
  try {
    await expect(createTestDatabase()).rejects.toThrow(
      "TEST_DATABASE_ADMIN_URL must point to local PostgreSQL.",
    );
  } finally {
    if (originalAdminUrl === undefined) {
      delete process.env.TEST_DATABASE_ADMIN_URL;
    } else {
      process.env.TEST_DATABASE_ADMIN_URL = originalAdminUrl;
    }
  }
});

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
      const roles = await client.query<{ rolname: string }>(
        "SELECT rolname FROM pg_roles WHERE rolname = ANY($1::text[]) ORDER BY rolname",
        [["gm_admin", "gm_api", "gm_migrator", "gm_worker"]],
      );
      expect(roles.rows.map(({ rolname }) => rolname)).toEqual([
        "gm_admin",
        "gm_api",
        "gm_migrator",
        "gm_worker",
      ]);
    } finally {
      await client.end();
    }
  });
});
