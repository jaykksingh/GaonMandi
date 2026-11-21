export const defaultLocale = "hi";

export const catalogues = {
  hi: { app: { name: "गाँवमंडी" } },
  en: { app: { name: "GaonMandi" } },
} as const;

export type Locale = keyof typeof catalogues;
