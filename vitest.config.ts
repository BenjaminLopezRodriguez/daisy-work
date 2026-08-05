import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Mirrors the `@/*` path alias from tsconfig. Without it, any module that
 * imports through the alias is untestable, which quietly limits tests to the
 * few files that happen to use relative imports.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
