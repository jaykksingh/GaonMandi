import { expect, it } from "vitest";
import { tokens } from "./index.js";

it("exports generated design tokens", () => {
  expect(tokens.color.brand.default).toMatch(/^#[0-9A-F]{6}$/i);
});
