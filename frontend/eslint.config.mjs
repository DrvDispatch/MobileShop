import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Import local skin boundaries plugin
import skinBoundaries from "./eslint-rules/index.js";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // Skin boundary enforcement
  {
    files: ["src/skins/**/*.ts", "src/skins/**/*.tsx"],
    plugins: {
      "skin-boundaries": skinBoundaries,
    },
    rules: {
      "skin-boundaries/no-hooks-in-skins": "error",
    },
  },
]);

export default eslintConfig;
