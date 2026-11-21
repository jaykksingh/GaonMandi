import { accessSync, constants, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import process from "node:process";

const results = [];

function commandResult(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  return {
    status: result.status,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim(),
  };
}

function add(name, ok, detail, required = true) {
  results.push({ name, status: ok ? "OK" : required ? "MISSING" : "OPTIONAL", detail, required });
}

const node = process.versions.node.split(".").map(Number);
const nodeOk = node[0] > 22 || (node[0] === 22 && (node[1] ?? 0) >= 13);
add("Node.js", nodeOk, `${process.versions.node} (requires >=22.13)`);

const pnpm = commandResult("pnpm", ["--version"]);
add("pnpm", pnpm.status === 0, pnpm.status === 0 ? pnpm.output : "pnpm is not on PATH");

const java = commandResult("java", ["-version"]);
const javaVersion = java.output.match(/version "(\d+)/)?.[1];
add("Java", javaVersion === "17", java.output.split("\n")[0] ?? "java is not on PATH");

const androidHome = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT;
const sdkManager = commandResult("sdkmanager", ["--version"]);
const adb = commandResult("adb", ["version"]);
add("ANDROID_HOME", Boolean(androidHome && existsSync(androidHome)), androidHome ?? "not set");
add(
  "sdkmanager",
  sdkManager.status === 0,
  sdkManager.status === 0 ? (sdkManager.output.split("\n")[0] ?? "available") : "not on PATH",
);
add("adb", adb.status === 0, adb.status === 0 ? (adb.output.split("\n")[0] ?? "available") : "not on PATH");

const databaseUrl =
  process.env.TEST_DATABASE_ADMIN_URL ?? "postgres://postgres:gm_local_only@localhost:5432/postgres";
const postgres = commandResult("psql", [databaseUrl, "-Atqc", "select postgis_version()"]);
add(
  "Postgres + PostGIS",
  postgres.status === 0 && postgres.output.length > 0,
  postgres.status === 0 ? postgres.output : "psql connectivity or PostGIS check failed",
);

const minio = commandResult("minio", ["--version"]);
add(
  "MinIO",
  minio.status === 0,
  minio.status === 0 ? (minio.output.split("\n")[0] ?? "available") : "minio is not on PATH",
);
const mc = commandResult("mc", ["--version"]);
add("MinIO Client", mc.status === 0, mc.status === 0 ? "available" : "mc is not on PATH");

let virtualizationAvailable = false;
let virtualizationDetail = "not detected";
if (process.platform === "darwin") {
  const hvf = commandResult("sysctl", ["-n", "kern.hv_support"]);
  virtualizationAvailable = hvf.status === 0 && hvf.output === "1";
  virtualizationDetail = virtualizationAvailable ? "HVF available" : "HVF unavailable";
} else if (process.platform === "linux") {
  virtualizationAvailable = existsSync("/dev/kvm");
  if (virtualizationAvailable) {
    try {
      accessSync("/dev/kvm", constants.R_OK | constants.W_OK);
    } catch {
      virtualizationAvailable = false;
    }
  }
  virtualizationDetail = virtualizationAvailable ? "KVM available" : "KVM unavailable";
}
add("Emulator virtualization", virtualizationAvailable, virtualizationDetail, false);

const nameWidth = Math.max(...results.map(({ name }) => name.length));
console.log(`${"Check".padEnd(nameWidth)}  ${"Status".padEnd(8)}  Details`);
for (const result of results) {
  console.log(`${result.name.padEnd(nameWidth)}  ${result.status.padEnd(8)}  ${result.detail}`);
}

if (results.some((result) => result.required && result.status !== "OK")) {
  process.exitCode = 1;
}
