import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

const root = new URL("../../", import.meta.url);
const input = new URL("design/tokens.json", root);
const output = new URL("packages/ui-tokens/src/generated.ts", root);

function transform(value) {
  if (Array.isArray(value)) {
    return value.map(transform);
  }
  if (value && typeof value === "object") {
    if (Object.hasOwn(value, "$value")) {
      const tokenValue = transform(value.$value);
      return value.$type === "fontWeight" ? String(tokenValue) : tokenValue;
    }
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !key.startsWith("$"))
        .map(([key, child]) => [key, transform(child)]),
    );
  }
  if (typeof value === "string" && /^\d+(?:\.\d+)?px$/.test(value)) {
    return Number.parseFloat(value);
  }
  if (typeof value === "string" && /^\d+(?:\.\d+)?ms$/.test(value)) {
    return Number.parseFloat(value);
  }
  return value;
}

const tokens = JSON.parse(await readFile(input, "utf8"));
const generated = `// Generated from design/tokens.json. Do not edit by hand.\nexport const tokens = ${JSON.stringify(transform(tokens), null, 2)} as const;\n`;
await writeFile(output, await prettier.format(generated, { filepath: fileURLToPath(output) }));
console.log(`Generated ${fileURLToPath(output)}`);
