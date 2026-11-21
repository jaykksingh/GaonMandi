import { expect, it } from "vitest";
import { placeholder } from "./index.js";

it("exports the observability package placeholder", () => {
  expect(placeholder).toBe(true);
});
