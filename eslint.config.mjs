import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    plugins: {
      "unused-imports": unusedImports,
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  {
    files: [
      "src/services/listings/marketplace-listings.ts",
      "src/__tests__/**/*.ts",
      "src/**/__tests__/**/*.ts",
      "src/**/__tests__/**/*.tsx",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["src/features/forms/components/listing-create-form-renderer.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-vars": "off",
    },
  },
  prettier,
  {
    ignores: [
      ".agents/**",
      ".kilo/**",
      ".next/**",
      "build/**",
      "coverage/**",
      "next-env.d.ts",
      "out/**",
      "playwright-report/**",
      "test-results/**",
      "src/types/supabase.ts",
      "lib/claude-code-templates/**",
      "scratch/**",
      "scripts/**",
    ],
  },
];

export default eslintConfig;
