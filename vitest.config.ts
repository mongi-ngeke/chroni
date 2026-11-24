import "dotenv/config";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    // Les tests ne touchent jamais la base de dev : DATABASE_URL pointe sur la base de test.
    env: { DATABASE_URL: process.env.TEST_DATABASE_URL ?? "" },
    // Les tests d'intégration partagent une seule base.
    fileParallelism: false,
  },
});
