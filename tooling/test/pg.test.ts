import { Client } from "pg";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  applyMigrations,
  createTestDatabase,
  getLocalAdminUrl,
  getLocalPsqlEnvironment,
  type TestDatabase,
} from "./pg.js";

it("normalizes the admin URL to IPv4 loopback", () => {
  const adminUrl = getLocalAdminUrl("postgres://postgres:password@localhost:5432/postgres");
  expect(new URL(adminUrl).hostname).toBe("127.0.0.1");
});

it("clears inherited PostgreSQL overrides for migrations", () => {
  const environment = getLocalPsqlEnvironment({
    PGHOST: "db.example.com",
    PGHOSTADDR: "192.0.2.1",
    PGPORT: "9999",
    PGDATABASE: "production",
    PGUSER: "admin",
    PGPASSWORD: "fake-test-password",
    PGSERVICE: "production",
    PGSERVICEFILE: "/tmp/pg_service.conf",
  });
  expect(environment.PGHOSTADDR).toBe("127.0.0.1");
  expect(environment.PGPORT).toBe("5432");
  for (const key of ["PGHOST", "PGDATABASE", "PGUSER", "PGPASSWORD", "PGSERVICE", "PGSERVICEFILE"]) {
    expect(environment[key]).toBeUndefined();
  }
});

it.each([
  "postgres://postgres:password@db.example.com/postgres",
  "postgres://postgres:password@localhost/postgres?host=192.0.2.1",
  "postgres://postgres:password@localhost/postgres?hostaddr=192.0.2.1",
  "postgres://postgres:password@localhost/postgres?dbname=production",
  "postgres://postgres:password@localhost:5433/postgres",
  "postgres://postgres:password@localhost/postgres",
  "postgres://postgres:password@localhost/production",
])("rejects unsafe admin URLs before connecting: %s", async (adminUrl) => {
  const originalAdminUrl = process.env.TEST_DATABASE_ADMIN_URL;
  process.env.TEST_DATABASE_ADMIN_URL = adminUrl;
  try {
    await expect(createTestDatabase()).rejects.toThrow("without URL overrides.");
  } finally {
    if (originalAdminUrl === undefined) {
      delete process.env.TEST_DATABASE_ADMIN_URL;
    } else {
      process.env.TEST_DATABASE_ADMIN_URL = originalAdminUrl;
    }
  }
});

it.each([
  "postgres://postgres:password@localhost/postgres?host=192.0.2.1",
  "postgres://postgres:password@localhost/postgres?dbname=production",
  "postgres://postgres:password@localhost:5433/postgres",
  "postgres://postgres:password@localhost/postgres",
  "postgres://postgres:password@localhost/production",
])("rejects unsafe connection overrides in local setup: %s", (adminUrl) => {
  const result = spawnSync("bash", ["tooling/local/setup-db.sh"], {
    encoding: "utf8",
    env: { ...process.env, TEST_DATABASE_ADMIN_URL: adminUrl },
  });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("without URL overrides.");
});

it("pins setup-db connections despite inherited PostgreSQL environment overrides", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "gm-psql-"));
  const fakePsql = join(tempDir, "psql");
  writeFileSync(fakePsql, '#!/bin/sh\nprintf "%s %s\\n" "$PGHOSTADDR" "$PGPORT"\n');
  chmodSync(fakePsql, 0o755);
  try {
    const result = spawnSync("bash", ["tooling/local/setup-db.sh"], {
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${tempDir}:${process.env.PATH ?? ""}`,
        TEST_DATABASE_ADMIN_URL: "postgres://postgres:gm_local_only@localhost:5432/postgres",
        PGHOSTADDR: "192.0.2.1",
        PGPORT: "9999",
        PGSERVICE: "production",
      },
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("127.0.0.1 5432");
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

it("disables psql startup files before applying migrations", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "gm-migrations-"));
  const migrationsDir = join(tempDir, "migrations");
  const binDir = join(tempDir, "bin");
  const argsFile = join(tempDir, "psql-args.txt");
  const fakePsql = join(binDir, "psql");
  mkdirSync(migrationsDir);
  mkdirSync(binDir);
  writeFileSync(join(migrationsDir, "001_test.sql"), "SELECT 1;\n");
  writeFileSync(fakePsql, '#!/bin/sh\nprintf "%s\\n" "$@" > "$PSQL_ARGS_FILE"\n');
  chmodSync(fakePsql, 0o755);
  try {
    applyMigrations("postgres://postgres@127.0.0.1:5432/gm_test_fixture", migrationsDir, {
      ...getLocalPsqlEnvironment(),
      PATH: `${binDir}:${process.env.PATH ?? ""}`,
      PSQL_ARGS_FILE: argsFile,
    });
    expect(readFileSync(argsFile, "utf8").split("\n")).toContain("--no-psqlrc");
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
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
