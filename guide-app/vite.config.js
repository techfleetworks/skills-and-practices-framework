import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev-server config only (`npm run dev` serves the guide entry index.html with HMR).
// Production builds all pages via build-site.mjs (`npm run build`), which compiles home,
// about, and the guide into the repo as self-contained static output. base "./" keeps asset
// URLs relative so the site works under the Pages subpath and a future custom domain.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
