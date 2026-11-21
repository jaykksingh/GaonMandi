module.exports = {
  preset: "@react-native/jest-preset",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@gaonmandi/i18n$": "<rootDir>/../../packages/i18n/src/index.ts",
    "^@gaonmandi/ui-tokens$": "<rootDir>/../../packages/ui-tokens/src/index.ts",
  },
};
