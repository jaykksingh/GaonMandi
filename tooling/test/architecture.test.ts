import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const eslint = new ESLint({ cwd: process.cwd() });

describe("pure rules and geo lint restrictions", () => {
  it.each([
    ["packages/rules/src/clock.ts", "Date.now();"],
    ["packages/geo/src/clock.ts", "new Date();"],
    ["packages/rules/src/random.ts", "Math.random();"],
    ["packages/geo/src/network.ts", "fetch('/example');"],
  ])("rejects impure code in %s", async (filePath, source) => {
    const [result] = await eslint.lintText(source, { filePath });
    expect(result?.messages.some(({ ruleId }) => ruleId === "no-restricted-syntax")).toBe(true);
  });
});
