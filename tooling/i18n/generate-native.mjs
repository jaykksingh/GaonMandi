import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const sourcePath = fileURLToPath(new URL("../../packages/i18n/src/index.ts", import.meta.url));
const source = ts.createSourceFile(
  sourcePath,
  readFileSync(sourcePath, "utf8"),
  ts.ScriptTarget.Latest,
  true,
);
const catalogueDeclaration = source.statements
  .filter(ts.isVariableStatement)
  .flatMap(({ declarationList }) => declarationList.declarations)
  .find((declaration) => ts.isIdentifier(declaration.name) && declaration.name.text === "catalogues");
const catalogueInitializer =
  catalogueDeclaration?.initializer && ts.isAsExpression(catalogueDeclaration.initializer)
    ? catalogueDeclaration.initializer.expression
    : catalogueDeclaration?.initializer;

if (!catalogueInitializer || !ts.isObjectLiteralExpression(catalogueInitializer)) {
  throw new Error("Could not read the i18n catalogues object.");
}

function readObject(node) {
  if (!ts.isObjectLiteralExpression(node)) {
    throw new Error("Expected an object literal in the i18n catalogues.");
  }
  return Object.fromEntries(
    node.properties.map((property) => {
      if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name)) {
        throw new Error("Expected named property assignments in the i18n catalogues.");
      }
      const value = property.initializer;
      if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) {
        return [property.name.text, value.text];
      }
      return [property.name.text, readObject(value)];
    }),
  );
}

const catalogues = readObject(catalogueInitializer);
const locales = Object.entries(catalogues);

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, (character) => {
    const entities = { "<": "&lt;", ">": "&gt;", "&": "&amp;" };
    return entities[character] ?? character;
  });
}

for (const [locale, catalogue] of locales) {
  const directory =
    locale === "hi"
      ? new URL("../../apps/mobile/android/app/src/main/res/values/", import.meta.url)
      : new URL(`../../apps/mobile/android/app/src/main/res/values-${locale}/`, import.meta.url);
  const outputPath = fileURLToPath(new URL("strings.xml", directory));
  const contents = `<!-- Generated from packages/i18n/src/index.ts. -->\n<resources>\n    <string name="app_name">${escapeXml(catalogue.app.name)}</string>\n</resources>\n`;
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, contents);
}
