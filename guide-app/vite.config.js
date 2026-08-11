import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Builds the React + MUI guide into the repo's /learn folder as static, self-hosted assets.
// base: "./" keeps asset URLs relative, so it works under the Pages subpath and under a future
// custom domain without changes. The app fetches ../data/json/framework.snapshot.json at runtime.
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "../learn",
    emptyOutDir: true,
  },
});
