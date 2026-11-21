import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const releaseDir = "apps/mobile/android/app/build/outputs/apk/release";
const apk = readdirSync(releaseDir).find((file) => file.endsWith(".apk") && file.includes("arm64-v8a"));

if (!apk) {
  throw new Error(`arm64-v8a release APK not found in ${releaseDir}`);
}

const sizeBytes = statSync(join(releaseDir, apk)).size;
const sizeMb = sizeBytes / (1024 * 1024);
console.log(`arm64-v8a release APK: ${sizeMb.toFixed(2)} MB`);

if (sizeBytes >= 25 * 1024 * 1024) {
  throw new Error("The arm64-v8a release APK must be smaller than 25 MB.");
}
