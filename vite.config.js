import { defineConfig } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { configDefaults } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: ".", // Still fine
  resolve: {
    alias: {
      "#js": resolve(__dirname, "js"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        channels: resolve(__dirname, "html/channels.html"),
        login: resolve(__dirname, "html/loginPage.html"),
        home: resolve(__dirname, "html/HomePage.html"),
        forget: resolve(__dirname, "html/forget.html"),
        contact: resolve(__dirname, "html/contact.html"),
      },
    },
  },
  server: {
    open: "/html/loginPage.html",
  },
  test: {
    globals: true,
    environment: "jsdom",
    exclude: [...configDefaults.exclude, "dist/**"],
  },
});
