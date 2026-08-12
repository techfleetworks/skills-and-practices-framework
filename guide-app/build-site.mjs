// Builds the React + MUI pages into the repo as self-contained static output:
//   home.html    -> /index.html         (+ /assets)
//   about.html   -> /about/index.html   (+ /about/assets)
//   index.html   -> /learn/index.html   (+ /learn/assets)
//   careers.html -> /careers/index.html (+ /careers/assets)
// Each page is built independently with base "./", so its assets sit beside its HTML and the
// whole site stays portable to a custom domain (no absolute base path). Nothing is loaded from
// a CDN at runtime. Run with: npm run build
import { build } from "vite";
import react from "@vitejs/plugin-react";
import { cp, rm, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const pages = [
  { name: "home", html: "home.html", outHtml: "home.html", destDir: "..", destHtml: "../index.html" },
  { name: "about", html: "about.html", outHtml: "about.html", destDir: "../about", destHtml: "../about/index.html" },
  { name: "guide", html: "index.html", outHtml: "index.html", destDir: "../learn", destHtml: "../learn/index.html" },
  { name: "careers", html: "careers.html", outHtml: "careers.html", destDir: "../careers", destHtml: "../careers/index.html" },
];

for (const p of pages) {
  await build({
    root,
    configFile: false,
    plugins: [react()],
    base: "./",
    logLevel: "warn",
    build: {
      outDir: resolve(root, "dist", p.name),
      emptyOutDir: true,
      rollupOptions: { input: resolve(root, p.html) },
    },
  });
}

for (const p of pages) {
  const src = resolve(root, "dist", p.name);
  await rm(resolve(root, p.destDir, "assets"), { recursive: true, force: true });
  await mkdir(resolve(root, p.destDir), { recursive: true });
  await cp(resolve(src, "assets"), resolve(root, p.destDir, "assets"), { recursive: true });
  await cp(resolve(src, p.outHtml), resolve(root, p.destHtml));
  console.log(`synced ${p.name} -> ${p.destHtml}`);
}
console.log("Site build complete: /index.html, /about/, /learn/");
