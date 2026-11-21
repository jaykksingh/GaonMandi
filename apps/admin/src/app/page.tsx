import { catalogues, defaultLocale } from "@gaonmandi/i18n";

export default function Page() {
  return (
    <main>
      <h1>{catalogues[defaultLocale].app.name}</h1>
    </main>
  );
}
