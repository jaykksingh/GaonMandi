import { expect, it } from "vitest";
import { workerPlaceholder } from "./index.js";

it("exports the worker placeholder", () => {
  expect(workerPlaceholder).toBe(true);
});
