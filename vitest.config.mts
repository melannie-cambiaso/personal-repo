import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      // server-only throws in non-server environments; stub it out for tests
      "server-only": path.resolve("./node_modules/next/dist/compiled/server-only/empty.js"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    // Playwright owns e2e/ (its *.spec.ts would otherwise match Vitest's default include).
    exclude: [...configDefaults.exclude, "e2e/**"],
    coverage: {
      provider: "v8",
      include: ["app/**/*.{ts,tsx}", "features/**/*.{ts,tsx}", "shared/**/*.{ts,tsx}"],
      exclude: ["**/*.test.{ts,tsx}", "**/index.ts"],
      reporter: ["text-summary", "text", "html"],
    },
  },
});
