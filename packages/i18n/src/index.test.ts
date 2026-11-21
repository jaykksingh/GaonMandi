import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import { catalogues, defaultLocale } from "./index.js";

const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));

it("exports the Hindi-first app name in both catalogues", () => {
  expect(defaultLocale).toBe("hi");
  expect(catalogues.hi.app.name).toBe("गाँवमंडी");
  expect(catalogues.en.app.name).toBe("GaonMandi");
});

it.each([
  ["apps/mobile/android/app/src/main/res/values/strings.xml", catalogues.hi.app.name],
  ["apps/mobile/android/app/src/main/res/values-en/strings.xml", catalogues.en.app.name],
])("generates the native app name from i18n: %s", (path, appName) => {
  expect(readFileSync(resolve(workspaceRoot, path), "utf8")).toContain(appName);
});
