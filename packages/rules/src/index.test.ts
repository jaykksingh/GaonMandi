import { expect, it } from "vitest";
import { placeholder } from "./index.js";

it("exports the rules package placeholder", () => {
  expect(placeholder).toBe(true);
});
