#!/usr/bin/env bash
set -euo pipefail

admin_url="${TEST_DATABASE_ADMIN_URL:-postgres://postgres:gm_local_only@localhost:5432/postgres}"

psql "$admin_url" --set=ON_ERROR_STOP=1 <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', 'gm_migrator', 'gm_local_only')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gm_migrator') \gexec
ALTER ROLE gm_migrator WITH LOGIN PASSWORD 'gm_local_only';

SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', 'gm_api', 'gm_local_only')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gm_api') \gexec
ALTER ROLE gm_api WITH LOGIN PASSWORD 'gm_local_only';

SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', 'gm_worker', 'gm_local_only')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gm_worker') \gexec
ALTER ROLE gm_worker WITH LOGIN PASSWORD 'gm_local_only';

SELECT format('CREATE DATABASE %I', 'gaonmandi')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'gaonmandi') \gexec
\connect gaonmandi
CREATE EXTENSION IF NOT EXISTS postgis;
SQL
