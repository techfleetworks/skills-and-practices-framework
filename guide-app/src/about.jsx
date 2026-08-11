import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { CssBaseline, Box, Container, Typography, Link, Toolbar, Divider, CircularProgress } from "@mui/material";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { makeTheme } from "./theme.js";
import SiteNav from "./SiteNav.jsx";
import Footer from "./Footer.jsx";

// The About page renders the repository's own README.md at runtime, so the story stays in sync
// with the source of truth. The first "# ..." heading is dropped in favor of the page hero.
const components = {
  h1: ({ node, ...p }) => <Typography variant="h4" sx={{ mt: 5, mb: 1.5 }} {...p} />,
  h2: ({ node, ...p }) => <Typography variant="h5" sx={{ mt: 4, mb: 1.5 }} {...p} />,
  h3: ({ node, ...p }) => <Typography variant="h6" sx={{ mt: 3, mb: 1 }} {...p} />,
  p: ({ node, ...p }) => <Typography sx={{ color: "text.secondary", my: 1.5, lineHeight: 1.7 }} {...p} />,
  a: ({ node, ...p }) => <Link target="_blank" rel="noopener" sx={{ wordBreak: "break-word" }} {...p} />,
  li: ({ node, ...p }) => <Box component="li" sx={{ color: "text.secondary", my: 0.6, lineHeight: 1.6 }} {...p} />,
  ul: ({ node, ...p }) => <Box component="ul" sx={{ pl: 3, my: 1 }} {...p} />,
  ol: ({ node, ...p }) => <Box component="ol" sx={{ pl: 3, my: 1 }} {...p} />,
  hr: () => <Divider sx={{ my: 4 }} />,
  blockquote: ({ node, ...p }) => (
    <Box component="blockquote" sx={{ borderLeft: 3, borderColor: "primary.main", pl: 2, my: 2, ml: 0, color: "text.secondary", fontStyle: "italic" }} {...p} />
  ),
  code: ({ node, ...p }) => (
    <Box component="code" sx={{ bgcolor: "action.hover", px: 0.7, py: 0.2, borderRadius: 1, fontSize: "0.9em", fontFamily: "ui-monospace, monospace" }} {...p} />
  ),
  strong: ({ node, ...p }) => <Box component="strong" sx={{ color: "text.primary", fontWeight: 700 }} {...p} />,
};

function stripLeadTitle(md) {
  // Remove the leading "# Title" and the italic byline/hr so the page hero doesn't duplicate them.
  const lines = md.split("\n");
  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++;
  if (lines[i] && /^#\s+/.test(lines[i])) i++;
  return lines.slice(i).join("\n");
}

function About() {
  const [md, setMd] = useState(null);
  useEffect(() => {
    fetch("../README.md").then((r) => (r.ok ? r.text() : Promise.reject())).then((t) => setMd(stripLeadTitle(t))).catch(() => setMd(""));
  }, []);
  return (
    <>
      <SiteNav base="../" active="about" />
      <Toolbar variant="dense" />
      <Box sx={{ bgcolor: (t) => (t.palette.mode === "dark" ? "rgba(145,178,223,0.06)" : "rgba(63,94,134,0.05)"), borderBottom: 1, borderColor: "divider" }}>
        <Container sx={{ maxWidth: "820px !important", py: { xs: 5, md: 7 } }}>
          <Typography variant="h1" sx={{ fontSize: { xs: 34, sm: 44 }, mb: 1.5 }}>The Skills &amp; Practices Framework</Typography>
          <Typography sx={{ fontSize: 18, color: "text.secondary", maxWidth: "60ch" }}>
            Created and maintained by Tech Fleet, a public charity on a mission to build empowered team spaces
            in the world. An ontological information architecture for professional development and career success.
          </Typography>
        </Container>
      </Box>
      <Container sx={{ maxWidth: "820px !important", py: 4 }}>
        {md === null ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, color: "text.secondary", py: 6 }}>
            <CircularProgress size={20} /> Loading…
          </Box>
        ) : md === "" ? (
          <Typography sx={{ color: "text.secondary" }}>Couldn't load the README. Read it on{" "}
            <Link href="https://github.com/techfleetworks/skills-and-practices-framework" target="_blank" rel="noopener">GitHub</Link>.
          </Typography>
        ) : (
          <Markdown remarkPlugins={[remarkGfm]} components={components}>{md}</Markdown>
        )}
      </Container>
      <Footer base="../" />
    </>
  );
}

function App() {
  const dark = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = useMemo(() => makeTheme(dark), [dark]);
  return (
    <ThemeProvider theme={theme}><CssBaseline />
      <About />
    </ThemeProvider>
  );
}

createRoot(document.getElementById("root")).render(<App />);
