import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["js/tests/**/*.vitest.mjs"],
    reporters: ["default"],
    coverage: {
      provider: "v8",
      include: ["js/**/*.js"],
      exclude: ["js/tests/**", "js/app/i18n.generated.js", "node_modules/**"],
      reporter: ["text", "text-summary", "lcov"],
      reportsDirectory: "coverage/js",
    },
  },
});
