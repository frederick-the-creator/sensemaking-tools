import globals from "globals";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default [
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { ignores: ["library/", "web-ui/", "api-server/", "docs/", "library/dist/"] },
  { languageOptions: { globals: globals.node } },
  ...tseslint.configs.recommended,
  prettier,
];
