import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  CssBaseline, Box, Container, Typography, Button, Stack, Chip, Card, CardActionArea,
  Toolbar, Divider,
} from "@mui/material";
import { makeTheme } from "./theme.js";
import SiteNav from "./SiteNav.jsx";
import Footer from "./Footer.jsx";

const OVERRIDE = { "job-specialization": "specializations", project: "project-types" };
const ORDER = ["project", "milestone", "deliverable", "activit", "skill", "practice", "dut", "job function", "specializ", "tool", "workshop", "methodolog", "stakeholder", "company", "industr"];
const oidx = (n) => { n = n.toLowerCase(); const i = ORDER.findIndex((k) => n.includes(k)); return i < 0 ? 99 : i; };
const palette = (i, n) => `hsl(${Math.round((i * 360 / n) + 15) % 360} 60% 50%)`;

function summarize(snap) {
  const ents = snap.entities.filter((e) => e.file.startsWith("framework-data/"));
  const names = new Set(ents.map((e) => e.entity));
  const entityFor = (t) => {
    if (OVERRIDE[t.slug]) return OVERRIDE[t.slug];
    const s = t.slug, cands = [s, s + "s", s.replace(/y$/, "ies"), s + "es"];
    for (const c of cands) if (names.has(c)) return c;
    const norm = (x) => x.toLowerCase().replace(/[^a-z]/g, "").replace(/s$/, "");
    const n = norm(t["Data Type Name"]);
    for (const en of names) { const e = norm(en); if (e.startsWith(n) || n.startsWith(e)) return en; }
    return null;
  };
  const types = (snap.data["data-types"] || []).slice().sort((a, b) => oidx(a["Data Type Name"]) - oidx(b["Data Type Name"]));
  const rows = types.map((t, i) => {
    const en = entityFor(t);
    const count = en ? (snap.data[en] || []).length : 0;
    return { slug: t.slug, name: t["Data Type Name"], desc: t["Data Type Description"], count, color: palette(i, types.length) };
  });
  const total = rows.reduce((a, r) => a + r.count, 0);
  return { rows, total };
}

const CTAs = ({ size = "large" }) => (
  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
    <Button size={size} variant="contained" href="learn/">Take the guided tour</Button>
    <Button size={size} variant="outlined" href="explore/">Explore the map</Button>
  </Stack>
);

function HeroFlow() {
  const steps = [
    ["Project", "hsl(15 60% 50%)"], ["Milestone", "hsl(39 60% 50%)"], ["Deliverable", "hsl(63 60% 50%)"],
    ["Activity", "hsl(87 60% 50%)"], ["Skill", "hsl(111 60% 50%)"],
  ];
  return (
    <Box sx={{ p: 2.5, border: 1, borderColor: "divider", borderRadius: 3, bgcolor: "background.paper" }}>
      <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "text.secondary", mb: 1.5 }}>
        One thread through the web
      </Typography>
      <Stack direction="row" flexWrap="wrap" alignItems="center" useFlexGap spacing={0.5}>
        {steps.map(([label, c], i) => (
          <React.Fragment key={label}>
            <Chip label={label} sx={{ bgcolor: c, color: "#fff", fontWeight: 700 }} />
            {i < steps.length - 1 && <Box component="span" sx={{ color: "text.secondary", px: 0.3 }}>→</Box>}
          </React.Fragment>
        ))}
      </Stack>
      <Typography sx={{ mt: 1.5, color: "text.secondary", fontSize: 14 }}>
        …every step shaped by the team's <b>practices</b>, owned by a <b>duty</b>, and handed to <b>stakeholders</b>.
      </Typography>
    </Box>
  );
}

function Stat({ big, label }) {
  return (
    <Box sx={{ textAlign: "center", px: 1 }}>
      <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: { xs: 28, sm: 34 }, lineHeight: 1, color: "primary.main" }}>{big}</Typography>
      <Typography sx={{ color: "text.secondary", fontSize: 13, mt: 0.5 }}>{label}</Typography>
    </Box>
  );
}

function Benefit({ eyebrow, title, children, points }) {
  return (
    <Box sx={{ py: 1 }}>
      <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "primary.main", mb: 0.5 }}>{eyebrow}</Typography>
      <Typography variant="h4" sx={{ mb: 1 }}>{title}</Typography>
      <Typography sx={{ color: "text.secondary", maxWidth: "60ch", mb: points ? 1.5 : 0 }}>{children}</Typography>
      {points && (
        <Stack spacing={0.6}>
          {points.map((p) => (
            <Typography key={p} sx={{ color: "text.secondary" }}>
              <Box component="span" sx={{ color: "primary.main", fontWeight: 800, mr: 1 }}>→</Box>{p}
            </Typography>
          ))}
        </Stack>
      )}
    </Box>
  );
}

const Section = ({ children, sx }) => (
  <Container sx={{ maxWidth: "1040px !important", py: { xs: 4, md: 6 }, ...sx }}>{children}</Container>
);

function Home({ D }) {
  const dark = useMediaQuery("(prefers-color-scheme: dark)");
  return (
    <>
      <SiteNav base="" active="home" />
      <Toolbar variant="dense" />

      {/* Above the fold */}
      <Box sx={{ bgcolor: dark ? "rgba(145,178,223,0.06)" : "rgba(63,94,134,0.05)", borderBottom: 1, borderColor: "divider" }}>
        <Section sx={{ py: { xs: 5, md: 8 } }}>
          <Box sx={{ display: "grid", gap: 4, gridTemplateColumns: { xs: "1fr", md: "1.15fr 0.85fr" }, alignItems: "center" }}>
            <Box>
              <Chip size="small" label="Open data from Tech Fleet · CC BY 4.0" sx={{ mb: 2, fontWeight: 600 }} />
              <Typography variant="h1" sx={{ fontSize: { xs: 34, sm: 46 }, lineHeight: 1.08, mb: 2 }}>
                Know what it really takes to succeed in the work.
              </Typography>
              <Typography sx={{ fontSize: { xs: 17, sm: 19 }, color: "text.secondary", maxWidth: "58ch", mb: 3 }}>
                The Skills &amp; Practices Framework is a free, human-centered map of the skills, practices,
                tools, and real deliverables behind tech roles. Built over three years from how empowered
                teams actually deliver. Explore it, learn from it, and build on it.
              </Typography>
              <CTAs />
            </Box>
            <HeroFlow />
          </Box>
        </Section>
      </Box>

      {/* Credibility strip */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Container sx={{ maxWidth: "1040px !important", py: 3 }}>
          <Stack direction="row" flexWrap="wrap" justifyContent="space-around" useFlexGap spacing={2}>
            <Stat big="3 yrs" label="in the making" />
            <Stat big={D ? D.total.toLocaleString() : "—"} label="connected concepts" />
            <Stat big="15" label="data types" />
            <Stat big="1" label="shared language" />
          </Stack>
        </Container>
      </Box>

      {/* Problem */}
      <Section>
        <Typography variant="h3" sx={{ mb: 2 }}>Every company speaks a different language of success.</Typography>
        <Typography sx={{ fontSize: 18, color: "text.secondary", maxWidth: "68ch" }}>
          The same job title means different daily work at different companies. Startups, agencies, and
          in-house teams expect different things. Skills get described a hundred ways, and buzzwords get
          read wrong. So new grads and career changers keep re-learning what they thought they knew every
          time they face a new role. The gap between what school taught and what the work needs keeps growing.
        </Typography>
      </Section>

      {/* Social proof — measured impact */}
      <Box sx={{ bgcolor: "background.paper", borderTop: 1, borderBottom: 1, borderColor: "divider" }}>
        <Section>
          <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "text.secondary", mb: 1 }}>
            Measured, not claimed
          </Typography>
          <Typography variant="h4" sx={{ mb: 3, maxWidth: "50ch" }}>
            When Tech Fleet trained teams with this framework, teamwork got measurably better.
          </Typography>
          <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4,1fr)" } }}>
            <Stat big="+40%" label="cross-functional teamwork" />
            <Stat big="+35%" label="shared ownership" />
            <Stat big="+20%" label="psychological safety" />
            <Stat big="+20%" label="team readiness" />
          </Box>
          <Typography sx={{ color: "text.secondary", fontSize: 13, mt: 3 }}>
            From Tech Fleet's 2026 impact measurement. Read the full impact report at{" "}
            <Box component="a" href="https://techfleet.org" target="_blank" rel="noopener" sx={{ color: "primary.main" }}>techfleet.org</Box>.
          </Typography>
        </Section>
      </Box>

      {/* Benefit blocks */}
      <Section>
        <Box sx={{ display: "grid", gap: 4, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          <Benefit eyebrow="See the target" title="A clear picture of the role, not a vague job post"
            points={["Pick a role you want to grow into", "See the duties it owns, the skills it needs, the deliverables it produces", "Now you know what ready actually looks like"]}>
            Instead of guessing from a job description, follow the real work a role is made of.
          </Benefit>
          <Benefit eyebrow="Use what you have" title="Translate the experience you already built"
            points={["Managed projects, taught, wrote, or ran research elsewhere? Those are real skills", "Career-transition guides name your transferable skills and the gaps to close", "The experience you bring gives you a head start"]}>
            The framework is built for people trying to get in, as much as for people already there.
          </Benefit>
          <Benefit eyebrow="Prove it" title="Build a portfolio around what shows your value"
            points={["Every deliverable you make on a real team is proof of what you can do", "A hiring manager can see the roadmap, the research report, the prototype", "Aim your practice at the deliverables that show your worth"]}>
            A hiring manager may never see the hours you spent thinking, but they can see what you made.
          </Benefit>
          <Benefit eyebrow="The invisible part" title="Make team practices visible, not just skills"
            points={["Seven core practices, from shared ownership to psychological safety", "Each described at four levels of maturity, so growth is something you can see", "Practices are why two teams with the same skills get different results"]}>
            Most training only teaches skills and tools. Something else makes a team good: team practices.
          </Benefit>
        </Box>
      </Section>

      {/* How it works — the web + the 15 types */}
      <Box sx={{ bgcolor: "background.paper", borderTop: 1, borderColor: "divider" }}>
        <Section>
          <Typography variant="h3" sx={{ mb: 2 }}>It works like a web. Follow any thread and you reach the others.</Typography>
          <Typography sx={{ color: "text.secondary", maxWidth: "70ch", mb: 1 }}>
            A project moves through milestones. Each milestone is marked by the deliverables a team produces.
            Each deliverable is made through activities and focused workshops. Those activities call for certain
            skills and are shaped by the team's practices. A duty is accountable for each piece of work, and
            duties group into job functions and specializations. The team uses tools, follows a methodology, and
            hands results to stakeholders. Company type and industry shape which of these matter most.
          </Typography>
          <Typography sx={{ color: "text.secondary", maxWidth: "70ch", mb: 3 }}>
            And it is not a straight line. Agile teamwork loops in iterations, scope grows as the team learns,
            and milestones are not steps one through ten. The framework is built to respect that.
          </Typography>
          <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "text.secondary", mb: 1.5 }}>
            The 15 data types
          </Typography>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))" }}>
            {(D ? D.rows : []).map((t) => (
              <Card key={t.slug} variant="outlined">
                <CardActionArea href={"learn/#type/" + t.slug} sx={{ p: 2, height: "100%", display: "block" }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                    <Box sx={{ width: 11, height: 11, borderRadius: "3px", bgcolor: t.color }} />
                    <Typography variant="h6" sx={{ fontSize: 17 }}>{t.name}</Typography>
                  </Stack>
                  <Typography sx={{ color: "text.secondary", fontSize: 14, mb: 0.5 }}>{t.desc}</Typography>
                  <Typography sx={{ color: "primary.main", fontWeight: 700, fontSize: 13 }}>{t.count} examples →</Typography>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        </Section>
      </Box>

      {/* Audiences */}
      <Section>
        <Typography variant="h3" sx={{ mb: 3 }}>Made for the people doing the work</Typography>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
          {[
            ["Career changers & new grads", "See the target, translate the experience you already have, and aim your practice at the deliverables that get you hired."],
            ["Teams", "A shared language and a mirror. Same words for the work, the invisible practices made visible, and a way to see your growth over time."],
            ["Hiring managers", "Build job requirements on standards the best teams have set. Consistency, accuracy, and visibility people can act on."],
            ["Developers & AI systems", "Open, documented data to ground answers and power tools. Treat every row as real, and say so when the data does not cover something."],
          ].map(([h, b]) => (
            <Card key={h} variant="outlined" sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ mb: 0.5 }}>{h}</Typography>
              <Typography sx={{ color: "text.secondary" }}>{b}</Typography>
            </Card>
          ))}
        </Box>
      </Section>

      {/* Open by design */}
      <Box sx={{ bgcolor: "background.paper", borderTop: 1, borderColor: "divider" }}>
        <Section>
          <Typography variant="h3" sx={{ mb: 2 }}>Open by design</Typography>
          <Typography sx={{ color: "text.secondary", maxWidth: "68ch", mb: 2 }}>
            The whole framework is published as open data you can read right now, for free, with no account and
            no key. Fork it, remix it, build a coaching tool or a curriculum on it, or hand it to an AI agent.
            It stays current on its own, syncing daily from the source. Field names stay the framework's own,
            with a mapping to schema.org and SKOS for standards-aware readers.
          </Typography>
          <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1.5}>
            <Button variant="outlined" href="api/">API &amp; docs</Button>
            <Button variant="outlined" href="data/json/manifest.json">Data manifest</Button>
            <Button variant="outlined" href="https://github.com/techfleetworks/skills-and-practices-framework" target="_blank" rel="noopener">GitHub ↗</Button>
            <Button variant="outlined" href="about/">Read the full story</Button>
          </Stack>
        </Section>
      </Box>

      {/* Closing CTA */}
      <Section sx={{ textAlign: "center" }}>
        <Typography variant="h3" sx={{ mb: 1.5 }}>Start walking the web.</Typography>
        <Typography sx={{ color: "text.secondary", mb: 3, maxWidth: "52ch", mx: "auto" }}>
          Pick a role or a milestone you care about, read what it is, and follow the links out to everything
          around it. Learn by exploring instead of memorizing lists.
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center" }}><CTAs /></Box>
      </Section>

      <Footer base="" />
    </>
  );
}

function App() {
  const dark = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = useMemo(() => makeTheme(dark), [dark]);
  const [D, setD] = useState(null);
  useEffect(() => {
    fetch("data/json/framework.snapshot.json").then((r) => r.json()).then((s) => setD(summarize(s))).catch(() => setD(null));
  }, []);
  return (
    <ThemeProvider theme={theme}><CssBaseline />
      <Home D={D} />
    </ThemeProvider>
  );
}

createRoot(document.getElementById("root")).render(<App />);
