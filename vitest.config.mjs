import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "node",
    setupFiles: ["ui/tests/vitest.setup.mjs"],
    transformMode: {
      web: [/\.vue$/],
    },
    include: ["ui/tests/**/*.vitest.mjs"],
    reporters: ["default"],
    coverage: {
      provider: "v8",
      include: ["ui/**/*.js"],
      exclude: ["ui/tests/**", "ui/app/i18n.generated.js", "node_modules/**"],
      reporter: ["text", "text-summary", "lcov"],
      reportsDirectory: "coverage/ui",
      thresholds: {
        lines: 30,
        branches: 20,
        functions: 30,
        statements: 30,
      },
    },
  },
});
