import { expect, it } from "vitest";
import { placeholder } from "./index.js";

it("exports the format package placeholder", () => {
  expect(placeholder).toBe(true);
});
