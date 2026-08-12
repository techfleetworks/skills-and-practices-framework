import { createTheme } from "@mui/material/styles";
// Self-hosted Poppins (bundled by Vite, no CDN) — the site typeface across every MUI surface.
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";

const stack = "'Poppins', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

export const makeTheme = (dark) =>
  createTheme({
    palette: {
      mode: dark ? "dark" : "light",
      primary: { main: dark ? "#91b2df" : "#3f5e86" },
      background: dark
        ? { default: "#17161a", paper: "#201f24" }
        : { default: "#f7f5f1", paper: "#ffffff" },
      divider: dark ? "#332f37" : "#e4dfd6",
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: stack,
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { fontWeight: 600 },
    },
    components: {
      // Sentence-case buttons, not MUI's default ALL-CAPS.
      MuiButton: { styleOverrides: { root: { textTransform: "none", fontWeight: 600 } } },
    },
  });
