#!/usr/bin/env bash
set -euo pipefail

minio_bin="${MINIO_BIN:-minio}"
mc_bin="${MC_BIN:-mc}"
data_dir=".data/minio"
config_dir=".data/minio/mc-config"
read_local_env() {
  local key="$1"
  if [ ! -f .env ]; then
    return 0
  fi
  awk -F= -v key="$key" '$1 == key { sub(/^[^=]*=/, ""); print; exit }' .env
}

root_user="${MINIO_ROOT_USER:-${S3_ACCESS_KEY_ID:-$(read_local_env S3_ACCESS_KEY_ID)}}"
root_password="${MINIO_ROOT_PASSWORD:-${S3_SECRET_ACCESS_KEY:-$(read_local_env S3_SECRET_ACCESS_KEY)}}"

command -v "$minio_bin" >/dev/null 2>&1 || {
  echo "Required MinIO binary not found: $minio_bin" >&2
  exit 1
}
command -v "$mc_bin" >/dev/null 2>&1 || {
  echo "Required MinIO Client (mc) binary not found: $mc_bin" >&2
  exit 1
}
if [ -z "$root_user" ] || [ -z "$root_password" ] ||
  [[ "$root_user" == replace-with-* || "$root_password" == replace-with-* ]]; then
  echo "Set unique S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY values in .env before starting MinIO." >&2
  exit 1
fi

mkdir -p "$data_dir" "$config_dir"
MINIO_ROOT_USER="$root_user" MINIO_ROOT_PASSWORD="$root_password" \
  "$minio_bin" server "$data_dir" --address "127.0.0.1:9000" --console-address "127.0.0.1:9001" &
minio_pid=$!
trap 'kill "$minio_pid" 2>/dev/null || true; wait "$minio_pid" 2>/dev/null || true' EXIT INT TERM

for attempt in $(seq 1 60); do
  if curl --fail --silent http://localhost:9000/minio/health/ready >/dev/null; then
    break
  fi
  if ! kill -0 "$minio_pid" 2>/dev/null; then
    wait "$minio_pid"
    echo "MinIO exited before it became ready." >&2
    exit 1
  fi
  if [ "$attempt" -eq 60 ]; then
    echo "MinIO did not become ready on port 9000." >&2
    exit 1
  fi
  sleep 1
done

"$mc_bin" --config-dir "$config_dir" alias set local http://localhost:9000 "$root_user" "$root_password"
"$mc_bin" --config-dir "$config_dir" mb --ignore-existing local/media
echo "MinIO is serving on ports 9000 and 9001; media bucket is ready."
wait "$minio_pid"
