import { randomBytes } from "node:crypto";
import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { Client } from "pg";

export interface TestDatabase {
  databaseUrl: string;
  drop: () => Promise<void>;
}

export async function createTestDatabase(): Promise<TestDatabase> {
  const adminUrl = process.env.TEST_DATABASE_ADMIN_URL;
  if (!adminUrl) {
    throw new Error("TEST_DATABASE_ADMIN_URL is required to create a throwaway test database.");
  }

  const databaseName = `gm_test_${randomBytes(8).toString("hex")}`;
  const databaseUrl = new URL(adminUrl);
  databaseUrl.pathname = `/${databaseName}`;
  const admin = new Client({ connectionString: adminUrl });
  let created = false;
  let connected = false;

  try {
    await admin.connect();
    connected = true;
    await admin.query(`CREATE DATABASE "${databaseName}"`);
    created = true;

    const databaseClient = new Client({ connectionString: databaseUrl.toString() });
    try {
      await databaseClient.connect();
      await databaseClient.query("CREATE EXTENSION IF NOT EXISTS postgis");
    } finally {
      await databaseClient.end();
    }

    applyMigrations(databaseUrl.toString());
  } catch (error) {
    if (created) {
      await dropDatabase(adminUrl, databaseName);
    }
    throw error;
  } finally {
    if (connected) {
      await admin.end();
    }
  }

  return {
    databaseUrl: databaseUrl.toString(),
    drop: () => dropDatabase(adminUrl, databaseName),
  };
}

async function dropDatabase(adminUrl: string, databaseName: string): Promise<void> {
  const cleanup = new Client({ connectionString: adminUrl });
  try {
    await cleanup.connect();
    await cleanup.query(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`);
  } finally {
    await cleanup.end();
  }
}

function applyMigrations(databaseUrl: string): void {
  const migrationsDir = resolve("packages/db/migrations");
  if (!existsSync(migrationsDir)) {
    return;
  }

  const migrations = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const migration of migrations) {
    const file = join(migrationsDir, migration);
    const result = spawnSync("psql", [databaseUrl, "--set=ON_ERROR_STOP=1", "--file", file], {
      encoding: "utf8",
    });
    if (result.status !== 0) {
      throw new Error(
        `Failed to apply migration ${migration}: ${result.stderr || result.error?.message || "psql exited unsuccessfully"}`,
      );
    }
  }
}
