import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  test: {
    environment: "node",
    clearMocks: true,
    projects: [
      { extends: true, test: { name: "packages", include: ["packages/*/src/**/*.test.ts"] } },
      {
        extends: true,
        test: { name: "apps", include: ["apps/{api,worker,admin}/src/**/*.test.{ts,tsx}"] },
      },
      { extends: true, test: { name: "tooling", include: ["tooling/test/**/*.test.ts"] } },
    ],
  },
});
