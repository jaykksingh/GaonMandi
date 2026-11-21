import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import globals from "globals";

const noDefaultExport = {
  selector: "ExportDefaultDeclaration",
  message: "Use named exports except for framework entry points.",
};
const noHexColor = {
  selector: "Literal[value=/^#[0-9a-f]{3,8}$/i]",
  message: "Use a design token instead of a hex colour.",
};
const noJsxText = {
  selector: "JSXText[value=/\\S/]",
  message: "Use a string from @gaonmandi/i18n instead of JSX text.",
};
const noStringUiAttribute = {
  selector:
    "JSXAttribute[name.name=/^(placeholder|title|aria-label|alt|accessibilityLabel|accessibilityHint)$/][value.type='Literal']",
  message: "Use a string from @gaonmandi/i18n for user-facing UI attributes.",
};
const uiRestrictions = [noDefaultExport, noHexColor, noJsxText, noStringUiAttribute];

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "apps/mobile/android/**",
      "apps/mobile/ios/**",
    ],
  },
  {
    files: ["apps/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: { ...globals.node, ...globals.browser },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "no-restricted-syntax": ["error", noDefaultExport],
    },
  },
  {
    files: ["apps/mobile/src/**/*.{ts,tsx}", "apps/mobile/App.tsx", "apps/admin/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": ["error", ...uiRestrictions.slice(1)],
    },
  },
  {
    files: [
      "apps/mobile/src/screens/**/*.{ts,tsx}",
      "apps/mobile/App.tsx",
      "apps/admin/src/app/**/page.{ts,tsx}",
      "apps/admin/src/app/**/layout.{ts,tsx}",
    ],
    rules: { "no-restricted-syntax": ["error", noHexColor, noJsxText, noStringUiAttribute] },
  },
];
