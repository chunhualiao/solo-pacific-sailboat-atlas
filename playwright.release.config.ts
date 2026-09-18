import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/release",
  use: { baseURL: "http://127.0.0.1:4180/atlas/" },
  webServer: {
    command:
      "npm run build -- --base=/atlas/ --outDir=dist-release-check && npm run preview -- --host 127.0.0.1 --port 4180 --strictPort --base=/atlas/ --outDir=dist-release-check",
    url: "http://127.0.0.1:4180/atlas/",
    timeout: 60000,
  },
});
