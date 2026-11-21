const apiModules = [
  "auth",
  "profiles",
  "villages",
  "media",
  "listings",
  "alerts",
  "bids",
  "deals",
  "contact",
  "safety",
  "notifications",
  "admin",
  "metrics",
];
const workerJobs = ["media", "alerts", "listings", "bids", "deals", "safety", "metrics"];
const moduleBoundaryRules = [
  ...apiModules.map((name) => ({
    name: `no-api-cross-import-${name}`,
    severity: "error",
    from: { path: `^apps/api/src/modules/${name}/` },
    to: { path: `^apps/api/src/modules/(?!${name}/)[^/]+/` },
  })),
  ...workerJobs.map((name) => ({
    name: `no-worker-cross-import-${name}`,
    severity: "error",
    from: { path: `^apps/worker/src/jobs/${name}/` },
    to: { path: `^apps/worker/src/jobs/(?!${name}/)[^/]+/` },
  })),
];

module.exports = {
  forbidden: [
    {
      name: "no-mobile-admin-server-imports",
      severity: "error",
      from: { path: "^apps/(mobile|admin)/" },
      to: {
        path: "^(packages/(db|notify|media|rules|observability)/|@gaonmandi/(db|notify|media|rules|observability)$)",
      },
    },
    {
      name: "no-rules-imports-outside-format",
      severity: "error",
      from: { path: "^packages/rules/" },
      to: { path: "^packages/(?!rules/|format/)[^/]+/" },
    },
    {
      name: "no-geo-package-imports",
      severity: "error",
      from: { path: "^packages/geo/" },
      to: { path: "^packages/(?!geo/)" },
    },
    {
      name: "no-rules-io-imports",
      severity: "error",
      from: { path: "^packages/(rules|geo)/" },
      to: { path: "^node:(fs|net|http|https|child_process|crypto|timers|os)" },
    },
    ...moduleBoundaryRules,
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(^|/)(node_modules|dist|build|\\.next)(/|$)" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.base.json" },
    enhancedResolveOptions: { exportsFields: ["exports"] },
  },
};
