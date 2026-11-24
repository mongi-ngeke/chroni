import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Le domaine doit rester pur : ni framework, ni ORM, ni validation.
const forbiddenInDomain = ["next", "next/*", "react", "react/*", "react-dom", "zod", "@prisma/*", "prisma", "prisma/*"];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    files: ["src/features/*/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: forbiddenInDomain }],
    },
  },
  // Fichiers générés ou tiers (skills d'agents, snapshots de migration Prisma).
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "next-env.d.ts",
    ".agents/**",
    ".claude/**",
    ".cursor/**",
    ".devin/**",
    ".pi/**",
    "migrations/**",
    "src/prisma/contract.d.ts",
  ]),
]);
