import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  CssBaseline, Box, Container, Typography, Toolbar, Card, CardActionArea, Chip,
  Breadcrumbs, Link, Stack, CircularProgress,
} from "@mui/material";
import { makeTheme } from "./theme.js";
import SiteNav from "./SiteNav.jsx";
import Footer from "./Footer.jsx";

const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const isLink = (v) => Array.isArray(v) && v.length && v[0] && typeof v[0] === "object" && "slug" in v[0];

// Prose fields shown as full sections; link fields shown as chip groups, in this order.
const PROSE = ["A Day in the Life", "Summary of the Gaps", "Training Recommendations"];
const ORDER = [
  "A Day in the Life", "Summary of the Gaps", "Training Recommendations",
  "Transferable Skills From This Industry", "Foundational Skills to Build",
  "Tools to Learn", "Methodologies to Learn", "Deliverables to Learn",
  "Duties in the New Field", "First Steps", "Practices Needed to Succeed",
  "Responsible Tasks", "Accountable Tasks", "Consulted Tasks",
];

function parse() {
  const h = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
  if (h.startsWith("role/")) return { view: "role", slug: h.slice(5) };
  if (h.startsWith("from/")) return { view: "from", slug: h.slice(5) };
  if (h.startsWith("path/")) return { view: "path", slug: h.slice(5) };
  return { view: "home" };
}
function useRoute() {
  const [r, setR] = useState(parse);
  useEffect(() => { const on = () => setR(parse()); addEventListener("hashchange", on); return () => removeEventListener("hashchange", on); }, []);
  return r;
}

const Loading = () => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 2, color: "text.secondary", py: 8 }}>
    <CircularProgress size={20} /> Loading the advice…
  </Box>
);
const Kicker = ({ children }) => (
  <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "text.secondary", mt: 3, mb: 1.2 }}>{children}</Typography>
);
const SectionHead = ({ children }) => (
  <Typography variant="h5" sx={{ mt: 3, pt: 1.4, borderTop: 1, borderColor: "divider", mb: 0.6 }}>{children}</Typography>
);

function ChipGroup({ label, items }) {
  const [open, setOpen] = useState(false);
  if (!items || !items.length) return null;
  const cap = 24;
  const shown = open ? items : items.slice(0, cap);
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "text.secondary", mt: 1.5, mb: 0.6 }}>{label}</Typography>
      <Stack direction="row" flexWrap="wrap" gap={0.6}>
        {shown.map((x) => (
          <Chip key={x.slug} clickable component="a" href={"../explore/#item/" + x.slug} target="_blank" rel="noopener" size="small" variant="outlined" label={x.label} />
        ))}
        {items.length > cap && (
          <Chip size="small" onClick={() => setOpen(!open)} label={open ? "Show fewer" : `+${items.length - cap} more`} sx={{ fontWeight: 700 }} />
        )}
      </Stack>
    </Box>
  );
}

function Overview({ D }) {
  return (
    <Box>
      <Typography variant="h3" sx={{ mb: 1 }}>Career transitioning advice</Typography>
      <Typography sx={{ color: "text.secondary", maxWidth: "68ch", mb: 1, fontSize: "1.05rem" }}>
        Moving into tech from another field? Start with the role you want to grow into, or with the field
        you're coming from. Each path spells out what carries over, the gaps to close, what to learn, and
        what a day in the job really looks like.
      </Typography>
      <Kicker>Roles you can grow into</Kicker>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fill,minmax(232px,1fr))" }}>
        {D.roles.map((r) => (
          <Card key={r.slug} variant="outlined">
            <CardActionArea href={"#role/" + r.slug} sx={{ p: 2.5, height: "100%", display: "block" }}>
              <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "primary.main" }}>Transition into</Typography>
              <Typography variant="h6" sx={{ mt: 0.5, mb: 0.5 }}>{r.name}</Typography>
              <Typography sx={{ color: "text.secondary", fontSize: 14 }}>See the paths in from other fields →</Typography>
            </CardActionArea>
          </Card>
        ))}
      </Box>
      <Kicker>Or start from the field you're coming from</Kicker>
      <Stack direction="row" flexWrap="wrap" gap={0.6}>
        {D.industries.map((i) => (
          <Chip key={i.slug} clickable component="a" href={"#from/" + i.slug} size="small" variant="outlined" label={i.label} />
        ))}
      </Stack>
    </Box>
  );
}

function RoleView({ D, slug }) {
  const role = D.roles.find((r) => r.slug === slug);
  if (!role) return <Overview D={D} />;
  const recs = role.records.slice().sort((a, b) => String(a["Transition From"]).localeCompare(String(b["Transition From"])));
  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1, fontSize: 14 }}><Link href="#" underline="hover">Career transitioning</Link><Typography sx={{ fontSize: 14 }}>{role.name}</Typography></Breadcrumbs>
      <Chip label="Transition into" size="small" color="primary" sx={{ mb: 1, fontWeight: 700 }} />
      <Typography variant="h3" sx={{ mb: 1 }}>{role.name}</Typography>
      <Typography sx={{ color: "text.secondary", maxWidth: "68ch", mb: 1 }}>
        Choose the field you're coming from to see how your experience transfers, the gaps to close, and a
        day in the life of a {role.name} role.
      </Typography>
      <Kicker>Where are you coming from?</Kicker>
      <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))" }}>
        {recs.map((r) => (
          <Card key={r.slug} variant="outlined"><CardActionArea href={"#path/" + r.slug} sx={{ p: 1.4 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>From {r["Transition From"]}</Typography>
          </CardActionArea></Card>
        ))}
      </Box>
    </Box>
  );
}

function FromView({ D, slug }) {
  const g = D.byFrom.get(slug);
  if (!g) return <Overview D={D} />;
  const items = g.items.slice().sort((a, b) => a.roleName.localeCompare(b.roleName));
  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1, fontSize: 14 }}><Link href="#" underline="hover">Career transitioning</Link><Typography sx={{ fontSize: 14 }}>From {g.label}</Typography></Breadcrumbs>
      <Chip label="Coming from" size="small" color="primary" sx={{ mb: 1, fontWeight: 700 }} />
      <Typography variant="h3" sx={{ mb: 1 }}>{g.label}</Typography>
      <Typography sx={{ color: "text.secondary", maxWidth: "68ch", mb: 1 }}>
        Here are the roles you can grow into from a background in {g.label}. Open one to see how your
        experience transfers and what to build next.
      </Typography>
      <Kicker>Roles you can move into</Kicker>
      <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))" }}>
        {items.map((it) => (
          <Card key={it.pathSlug} variant="outlined"><CardActionArea href={"#path/" + it.pathSlug} sx={{ p: 1.6 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "primary.main" }}>Into</Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 600 }}>{it.roleName}</Typography>
          </CardActionArea></Card>
        ))}
      </Box>
    </Box>
  );
}

function PathView({ D, slug }) {
  const rec = D.byPath.get(slug);
  if (!rec) return <Overview D={D} />;
  const roleSlug = slugify(rec["Target Field"]);
  const fromSlug = slugify(rec["Transition From"]);
  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1, fontSize: 14 }}>
        <Link href="#" underline="hover">Career transitioning</Link>
        <Link href={"#role/" + roleSlug} underline="hover">{rec["Target Field"]}</Link>
        <Link href={"#from/" + fromSlug} underline="hover">From {rec["Transition From"]}</Link>
      </Breadcrumbs>
      <Chip label={"Into " + rec["Target Field"]} size="small" color="primary" sx={{ mb: 1, fontWeight: 700 }} />
      <Typography variant="h3" sx={{ mb: 0.5 }}>Moving into {rec["Target Field"]} from {rec["Transition From"]}</Typography>
      {ORDER.map((k) => {
        const v = rec[k];
        if (v == null) return null;
        if (PROSE.includes(k)) {
          if (typeof v !== "string" || !v.trim()) return null;
          return (
            <Box key={k}>
              <SectionHead>{k}</SectionHead>
              {v.split(/\n+/).filter((p) => p.trim()).map((p, i) => (
                <Typography key={i} sx={{ color: "text.secondary", my: 0.5, maxWidth: "72ch" }}>{p.trim()}</Typography>
              ))}
            </Box>
          );
        }
        if (isLink(v)) return <ChipGroup key={k} label={k} items={v} />;
        return null;
      })}
      <Typography sx={{ color: "text.secondary", fontSize: 13, mt: 4, pt: 2, borderTop: 1, borderColor: "divider" }}>
        Chips link into the guide, where you can explore any skill, tool, deliverable, or task in full.
      </Typography>
    </Box>
  );
}

function Careers({ D }) {
  const route = useRoute();
  return (
    <>
      <SiteNav base="../" active="careers" />
      <Toolbar variant="dense" />
      <Container sx={{ maxWidth: "1000px !important", py: 4 }}>
        {!D ? <Loading />
          : route.view === "role" ? <RoleView D={D} slug={route.slug} />
          : route.view === "from" ? <FromView D={D} slug={route.slug} />
          : route.view === "path" ? <PathView D={D} slug={route.slug} />
          : <Overview D={D} />}
      </Container>
      <Footer base="../" />
    </>
  );
}

function App() {
  const dark = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = useMemo(() => makeTheme(dark), [dark]);
  const [D, setD] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const man = await (await fetch("../data/json/manifest.json")).json();
        const ct = man.entities.filter((e) => e.file.startsWith("career-transitioning/"));
        const files = await Promise.all(ct.map((e) => fetch("../data/json/" + e.file).then((r) => r.json())));
        const roles = ct
          .map((e, i) => ({ slug: slugify(e.targetField), name: e.targetField, records: files[i] || [] }))
          .sort((a, b) => a.name.localeCompare(b.name));
        const byPath = new Map();
        const byFrom = new Map();
        roles.forEach((r) => r.records.forEach((rec) => {
          byPath.set(rec.slug, rec);
          const key = slugify(rec["Transition From"]);
          if (!key) return;
          if (!byFrom.has(key)) byFrom.set(key, { label: rec["Transition From"], items: [] });
          byFrom.get(key).items.push({ roleName: r.name, roleSlug: r.slug, pathSlug: rec.slug });
        }));
        const industries = [...byFrom.entries()].map(([slug, g]) => ({ slug, label: g.label })).sort((a, b) => a.label.localeCompare(b.label));
        setD({ roles, byPath, byFrom, industries });
      } catch {
        setD({ roles: [], byPath: new Map(), byFrom: new Map(), industries: [] });
      }
    })();
  }, []);
  return (
    <ThemeProvider theme={theme}><CssBaseline />
      <Careers D={D} />
    </ThemeProvider>
  );
}

createRoot(document.getElementById("root")).render(<App />);
