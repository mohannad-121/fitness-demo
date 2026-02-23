import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";
var stdin_default = defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.js"],
    include: ["src/**/*.{test,spec}.{js,jsx}"]
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") }
  }
});
export {
  stdin_default as default
};
