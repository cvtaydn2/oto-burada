import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
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
    ],
  },
];

export default eslintConfig;
