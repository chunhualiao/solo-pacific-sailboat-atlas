import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  base: "./",
  plugins: [react()],
  test: { include: ["tests/**/*.test.ts"] },
  server: { host: "0.0.0.0" },
});
