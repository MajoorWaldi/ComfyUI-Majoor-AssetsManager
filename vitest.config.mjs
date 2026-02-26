import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["js/tests/**/*.vitest.mjs"],
    reporters: ["default"],
  },
});
