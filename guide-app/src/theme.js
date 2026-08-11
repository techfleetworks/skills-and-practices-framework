import { createTheme } from "@mui/material/styles";

// One theme for the whole site (guide + landing), so every MUI surface shares the same
// palette, radius, and serif headings. Colors match the explorer's hand-CSS variables so
// the React pages and the canvas tools read as one design system.
const serif = { fontFamily: "Georgia, 'Times New Roman', serif" };

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
    typography: { h1: serif, h2: serif, h3: serif, h4: serif, h5: serif, h6: serif },
    components: {
      // Sentence-case buttons, not MUI's default ALL-CAPS, to match the warm serif aesthetic.
      MuiButton: { styleOverrides: { root: { textTransform: "none", fontWeight: 600 } } },
    },
  });
