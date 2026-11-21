import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import Page from "./page.js";

it("renders the localized app name on the admin page", () => {
  expect(renderToStaticMarkup(Page())).toContain("गाँवमंडी");
});
