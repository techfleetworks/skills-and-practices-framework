import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { CssBaseline, Box, Container, Typography, Link, Toolbar, Divider, CircularProgress, Card, CardActionArea } from "@mui/material";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { makeTheme } from "./theme.js";
import SiteNav from "./SiteNav.jsx";
import Footer from "./Footer.jsx";

// Founder essays on Medium that explain the thinking behind the framework. Blurbs are short
// factual summaries written here (not reproduced from the articles).
const ARTICLES = [
  {
    url: "https://techfleet.medium.com/how-might-we-make-tech-fleet-talent-more-marketable-43ff3723c3ed",
    title: "How Might We Make Tech Fleet Talent More Marketable?",
    date: "Mar 2024",
    blurb: "The founding question behind the framework: how to make trainees' hard-won experience legible and marketable to employers.",
  },
  {
    url: "https://techfleet.medium.com/a-comprehensive-tech-skills-information-architecture-for-new-grads-and-career-changers-57a9b747582d",
    title: "A Comprehensive Tech Skills Information Architecture for New Grads and Career Changers",
    date: "May 2025",
    blurb: "Introduces the skills information architecture that became this framework, built for new grads and people changing careers.",
  },
  {
    url: "https://techfleet.medium.com/practices-the-invisible-components-that-drive-empowered-teamwork-5ee345fc10bd",
    title: "Practices: The Invisible Components That Drive Empowered Teamwork",
    date: "Aug 2025",
    blurb: "Why team practices, not just skills, are what make teams succeed, and how the framework makes them visible.",
  },
];

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
      <Container sx={{ maxWidth: "820px !important", pb: 2 }}>
        <Divider sx={{ mb: 4 }} />
        <Typography variant="h4" sx={{ mb: 0.5 }}>Further reading</Typography>
        <Typography sx={{ color: "text.secondary", mb: 3 }}>
          The thinking behind the framework, from Tech Fleet on Medium.
        </Typography>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" } }}>
          {ARTICLES.map((a) => (
            <Card key={a.url} variant="outlined">
              <CardActionArea href={a.url} target="_blank" rel="noopener" sx={{ p: 2.5, height: "100%", display: "block" }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "primary.main", mb: 1 }}>
                  Article · {a.date}
                </Typography>
                <Typography variant="h6" sx={{ fontSize: 18, lineHeight: 1.25, mb: 1 }}>{a.title}</Typography>
                <Typography sx={{ color: "text.secondary", fontSize: 14, mb: 1.5 }}>{a.blurb}</Typography>
                <Typography sx={{ color: "primary.main", fontWeight: 700, fontSize: 13 }}>Read on Medium ↗</Typography>
              </CardActionArea>
            </Card>
          ))}
        </Box>
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
