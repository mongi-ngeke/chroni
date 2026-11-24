import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Seule l'infrastructure parle à la base (client Prisma et contrat émis).
const persistence = ["@prisma/*", "prisma", "prisma/*", "@/prisma/*", "**/prisma/db", "**/prisma/contract*"];
// Le domaine doit rester pur : ni framework, ni validation, ni persistance.
const forbiddenInDomain = ["next", "next/*", "react", "react/*", "react-dom", "zod", ...persistence];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    // Les autres couches passent par des ports, jamais par Prisma directement.
    files: [
      "src/features/*/domain/**/*.{ts,tsx}",
      "src/features/*/application/**/*.{ts,tsx}",
      "src/features/*/presentation/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: persistence },
      ],
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
