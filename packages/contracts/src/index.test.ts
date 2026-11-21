import { expect, it } from "vitest";
import { placeholder } from "./index.js";

it("exports the contracts package placeholder", () => {
  expect(placeholder).toBe(true);
});
