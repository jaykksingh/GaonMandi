import { expect, it } from "vitest";
import { catalogues, defaultLocale } from "./index.js";

it("exports the Hindi-first app name in both catalogues", () => {
  expect(defaultLocale).toBe("hi");
  expect(catalogues.hi.app.name).toBe("गाँवमंडी");
  expect(catalogues.en.app.name).toBe("GaonMandi");
});
