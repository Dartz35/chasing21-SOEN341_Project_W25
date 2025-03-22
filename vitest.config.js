import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@setup": path.resolve(__dirname, "tests/setup"),
    },
  },
});
