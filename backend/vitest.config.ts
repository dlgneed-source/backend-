// vitest.config.ts for backend
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  root: __dirname,
  test: {
    environment: "node",
    globals: true,
    include: ["src/__tests__/**/*.{test,spec}.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
