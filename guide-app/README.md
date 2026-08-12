# Guide app (React + MUI)

Source for the framework's user guide, published at [`/explore`](../explore). It's a small
[Vite](https://vitejs.dev) + [React](https://react.dev) + [MUI](https://mui.com) app that
reads `../data/json/framework.snapshot.json` at runtime and renders a browsable guide:
each data type's meaning, how it relates to the rest of the work (in plain language),
its real examples, and every example with all of its cells and clickable connections.

## Why a build step
MUI is React-only and isn't distributed as a buildless UMD bundle, so we compile it here
and commit the **static output** to `../explore`. Nothing is loaded from a CDN at runtime —
consistent with how the rest of the site self-hosts its libraries. The built page is plain
static files that work under the Pages subpath and under a custom domain (assets use
relative paths; `base: "./"` in `vite.config.js`).

## Develop
```bash
npm install
npm run dev      # local dev server with HMR
```
The dev server needs the data next to it; run it from a static server that also serves the
repo's `data/` folder, or open the built `../explore` output.

## Build (regenerates ../explore)
```bash
npm install
npm run build
```
Output goes to `../explore` (`index.html` + one hashed JS bundle). Commit those alongside any
source change. The guide reads data at runtime, so **data updates never require a rebuild** —
only changes to this app's code do.
