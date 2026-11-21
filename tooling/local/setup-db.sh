#!/usr/bin/env bash
set -euo pipefail

admin_url="${TEST_DATABASE_ADMIN_URL:-postgres://postgres:gm_local_only@localhost:5432/postgres}"

node --input-type=module - "$admin_url" <<'NODE'
const adminUrl = new URL(process.argv[2] ?? "");
const host = adminUrl.hostname.replace(/^\[|\]$/g, "");
if (
  !["postgres:", "postgresql:"].includes(adminUrl.protocol) ||
  !["localhost", "127.0.0.1", "::1"].includes(host) ||
  adminUrl.port !== "5432" ||
  adminUrl.pathname !== "/postgres" ||
  adminUrl.search !== "" ||
  adminUrl.hash !== ""
) {
  console.error("TEST_DATABASE_ADMIN_URL must target local postgres on port 5432 without URL overrides.");
  process.exit(1);
}
NODE

env -u PGHOST -u PGHOSTADDR -u PGPORT -u PGDATABASE -u PGUSER -u PGPASSWORD \
  -u PGSERVICE -u PGSERVICEFILE PGHOSTADDR=127.0.0.1 PGPORT=5432 \
  psql "$admin_url" --no-psqlrc --set=ON_ERROR_STOP=1 <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', 'gm_migrator', 'gm_local_only')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gm_migrator') \gexec
SELECT format('ALTER ROLE %I LOGIN', 'gm_migrator')
WHERE EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gm_migrator' AND NOT rolcanlogin) \gexec

SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', 'gm_api', 'gm_local_only')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gm_api') \gexec
SELECT format('ALTER ROLE %I LOGIN', 'gm_api')
WHERE EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gm_api' AND NOT rolcanlogin) \gexec

SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', 'gm_worker', 'gm_local_only')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gm_worker') \gexec
SELECT format('ALTER ROLE %I LOGIN', 'gm_worker')
WHERE EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gm_worker' AND NOT rolcanlogin) \gexec

SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', 'gm_admin', 'gm_local_only')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gm_admin') \gexec
SELECT format('ALTER ROLE %I LOGIN', 'gm_admin')
WHERE EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gm_admin' AND NOT rolcanlogin) \gexec

SELECT format('CREATE DATABASE %I', 'gaonmandi')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'gaonmandi') \gexec
\connect gaonmandi
CREATE EXTENSION IF NOT EXISTS postgis;
SQL
