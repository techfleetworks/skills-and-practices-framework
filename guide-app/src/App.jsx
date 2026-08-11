import React, { useEffect, useMemo, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  CssBaseline, Toolbar, Typography, Box, Drawer, List, ListItemButton,
  ListItemText, ListSubheader, Container, Card, CardActionArea, Chip, Breadcrumbs,
  Link, TextField, Autocomplete, Stack, CircularProgress,
} from "@mui/material";
import { makeTheme } from "./theme.js";
import SiteNav from "./SiteNav.jsx";
import Footer from "./Footer.jsx";

const DRAWER = 236;
const titleCase = (s) => String(s).replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const isLink = (v) => Array.isArray(v) && v.length && v[0] && typeof v[0] === "object" && "slug" in v[0];
const isFile = (v) => Array.isArray(v) && v.length && v[0] && typeof v[0] === "object" && "url" in v[0] && !("slug" in v[0]);
const ORDER = ["project", "milestone", "deliverable", "activit", "skill", "practice", "dut", "job function", "specializ", "tool", "workshop", "methodolog", "stakeholder", "company", "industr"];
const oidx = (n) => { n = n.toLowerCase(); const i = ORDER.findIndex((k) => n.includes(k)); return i < 0 ? 99 : i; };
const OVERRIDE = { "job-specialization": "specializations", project: "project-types" };
const palette = (i, n) => `hsl(${Math.round((i * 360 / n) + 15) % 360} 60% 50%)`;
const go = (hash) => { window.location.hash = hash; };

function build(snap) {
  const ents = snap.entities.filter((e) => e.file.startsWith("framework-data/"));
  const primary = {}, color = {}, entityNames = new Set(ents.map((e) => e.entity));
  ents.forEach((e, i) => { primary[e.entity] = e.primaryField; color[e.entity] = palette(i, ents.length); });
  const nodes = new Map();
  for (const e of ents) for (const r of (snap.data[e.entity] || [])) {
    if (!r.slug || nodes.has(r.slug)) continue;
    nodes.set(r.slug, { slug: r.slug, entity: e.entity, label: r[primary[e.entity]] || r.slug, rec: r });
  }
  const entityFor = (t) => {
    if (OVERRIDE[t.slug]) return OVERRIDE[t.slug];
    const s = t.slug, cands = [s, s + "s", s.replace(/y$/, "ies"), s + "es"];
    for (const c of cands) if (entityNames.has(c)) return c;
    const norm = (x) => x.toLowerCase().replace(/[^a-z]/g, "").replace(/s$/, "");
    const n = norm(t["Data Type Name"]);
    for (const en of entityNames) { const e = norm(en); if (e.startsWith(n) || n.startsWith(e)) return en; }
    return null;
  };
  const types = (snap.data["data-types"] || []).slice().sort((a, b) => oidx(a["Data Type Name"]) - oidx(b["Data Type Name"]));
  const entityToType = {}, typeByName = {}, typeColor = {};
  types.forEach((t) => {
    const en = entityFor(t); if (en) entityToType[en] = t.slug; typeColor[t.slug] = en ? color[en] : "#888";
    const nm = String(t["Data Type Name"]).toLowerCase();
    [nm, nm.replace(/s$/, ""), nm + "s"].forEach((v) => (typeByName[v] = t.slug));
  });
  return { ents, primary, color, entityNames, nodes, entityFor, types, entityToType, typeByName, typeColor, data: snap.data };
}

function parse() {
  const h = decodeURIComponent(window.location.hash.replace(/^#\/?/, ""));
  if (h.startsWith("type/")) return { view: "type", slug: h.slice(5) };
  if (h.startsWith("item/")) return { view: "item", slug: h.slice(5) };
  return { view: "home" };
}
function useRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => { const on = () => setRoute(parse()); window.addEventListener("hashchange", on); return () => window.removeEventListener("hashchange", on); }, []);
  return route;
}

export default function App() {
  const dark = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = useMemo(() => makeTheme(dark), [dark]);
  const [D, setD] = useState(null);
  const route = useRoute();
  useEffect(() => {
    fetch("../data/json/framework.snapshot.json").then((r) => r.json()).then((s) => setD(build(s))).catch((e) => setD({ error: e.message }));
  }, []);
  return (
    <ThemeProvider theme={theme}><CssBaseline />
      {!D ? <Loading /> : D.error ? <Box p={4}>Couldn't load: {D.error}</Box> : <Shell D={D} route={route} />}
    </ThemeProvider>
  );
}

const Loading = () => (
  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", gap: 2, color: "text.secondary" }}>
    <CircularProgress size={22} /> Loading the guide…
  </Box>
);

function SectionHead({ children }) {
  return <Typography variant="h6" sx={{ fontFamily: "Georgia, serif", mt: 3, pt: 1.4, borderTop: 1, borderColor: "divider" }}>{children}</Typography>;
}
function Dot({ color }) { return <Box component="span" sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: color, display: "inline-block", ml: "6px" }} />; }

function Shell({ D, route }) {
  const active = route.view === "type" ? route.slug : route.view === "item" ? D.entityToType[D.nodes.get(route.slug)?.entity] : null;
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <SiteNav base="../" active="ontology"><SearchBox D={D} /></SiteNav>
      <Drawer variant="permanent" sx={{ width: DRAWER, flexShrink: 0, display: { xs: "none", md: "block" }, ["& .MuiDrawer-paper"]: { width: DRAWER, boxSizing: "border-box" } }}>
        <Toolbar variant="dense" />
        <List dense subheader={<ListSubheader sx={{ bgcolor: "transparent", fontWeight: 800, letterSpacing: ".06em" }}>DATA TYPES</ListSubheader>}>
          {D.types.map((t) => (
            <ListItemButton key={t.slug} selected={active === t.slug} component="a" href={"#type/" + t.slug}>
              <Box sx={{ width: 11, height: 11, borderRadius: "3px", bgcolor: D.typeColor[t.slug], mr: 1.2, flexShrink: 0 }} />
              <ListItemText primaryTypographyProps={{ fontSize: 14 }} primary={t["Data Type Name"]} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0 }}>
        <Toolbar variant="dense" />
        <Container sx={{ py: 4, maxWidth: "920px !important" }}>
          {route.view === "home" && <Home D={D} />}
          {route.view === "type" && <TypeView D={D} slug={route.slug} />}
          {route.view === "item" && <ItemView D={D} slug={route.slug} />}
        </Container>
        <Footer base="../" />
      </Box>
    </Box>
  );
}

function SearchBox({ D }) {
  const opts = useMemo(() => [...D.nodes.values()].map((n) => ({ label: n.label, slug: n.slug })), [D]);
  return (
    <Autocomplete size="small" options={opts} sx={{ width: { xs: 160, sm: 260 } }} blurOnSelect clearOnBlur
      isOptionEqualToValue={(a, b) => a.slug === b.slug}
      onChange={(e, v) => v && go("#item/" + v.slug)}
      renderInput={(p) => <TextField {...p} placeholder="Search any example…" />} />
  );
}

function Home({ D }) {
  return (
    <Box>
      <Typography variant="h3" sx={{ fontFamily: "Georgia, serif", mb: 1 }}>The framework, one piece at a time</Typography>
      <Typography sx={{ color: "text.secondary", maxWidth: "66ch", mb: 3, fontSize: "1.05rem" }}>
        This is the full guide. Choose a data type to learn what it means and how it works with the rest of the work,
        then browse its real examples and click into any one to explore its connections. Every reference is a link, so
        you can follow the web as far as you like.
      </Typography>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fill,minmax(232px,1fr))" }}>
        {D.types.map((t) => {
          const en = D.entityFor(t); const n = en ? (D.data[en] || []).length : 0;
          return (
            <Card key={t.slug} variant="outlined">
              <CardActionArea component="a" href={"#type/" + t.slug} sx={{ p: 2, height: "100%", display: "block" }}>
                <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: D.typeColor[t.slug] }}>Data type</Typography>
                <Typography variant="h6" sx={{ fontFamily: "Georgia, serif", mt: 0.5 }}>{t["Data Type Name"]}</Typography>
                <Typography sx={{ color: "text.secondary", fontSize: 14, my: 0.5 }}>{t["Data Type Description"]}</Typography>
                <Typography sx={{ color: "primary.main", fontWeight: 700, fontSize: 13 }}>{n} examples →</Typography>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}

function TypeView({ D, slug }) {
  const t = D.types.find((x) => x.slug === slug);
  const [q, setQ] = useState("");
  useEffect(() => setQ(""), [slug]);
  if (!t) return <Home D={D} />;
  const en = D.entityFor(t); const insts = en ? (D.data[en] || []) : []; const pf = en ? D.primary[en] : null;
  const rels = Object.keys(t).filter((k) => k.startsWith("Relationship to "));
  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1, fontSize: 14 }}><Link href="#" underline="hover">Guide</Link><Typography sx={{ fontSize: 14 }}>{t["Data Type Name"]}</Typography></Breadcrumbs>
      <Chip label="Data type" size="small" sx={{ bgcolor: D.typeColor[slug], color: "#fff", fontWeight: 700, mb: 1 }} />
      <Typography variant="h3" sx={{ fontFamily: "Georgia, serif" }}>{t["Data Type Name"]}</Typography>
      <Typography sx={{ fontSize: "1.12rem", mt: 1, mb: 1, maxWidth: "66ch" }}>{t["Data Type Description"]}</Typography>
      <SectionHead>How it works with the rest of the work</SectionHead>
      <Box sx={{ maxWidth: "70ch" }}>
        {rels.map((k) => {
          const to = k.replace("Relationship to ", "");
          const ts = D.typeByName[to.toLowerCase()] || D.typeByName[to.toLowerCase().replace(/s$/, "")];
          const pts = String(t[k]).split("\n").map((s) => s.trim()).filter((l) => /^\d+\./.test(l)).map((l) => l.replace(/^\d+\.\s*/, ""));
          return (
            <Typography key={k} sx={{ color: "text.secondary", my: 0.7 }}>
              {ts ? <Link href={"#type/" + ts} underline="hover" sx={{ fontWeight: 700, color: "text.primary" }}>{to}</Link> : <b>{to}</b>}. {pts.join(" ")}
            </Typography>
          );
        })}
      </Box>
      <SectionHead>Examples{insts.length ? ` · ${insts.length}` : ""}</SectionHead>
      {insts.length > 0 && <TextField size="small" placeholder="Filter examples…" value={q} onChange={(e) => setQ(e.target.value)} sx={{ mb: 1.5, width: 320, maxWidth: "100%" }} />}
      <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(auto-fill,minmax(196px,1fr))" }}>
        {insts.filter((r) => String(r[pf] || r.slug).toLowerCase().includes(q.toLowerCase())).map((r) => (
          <Card key={r.slug} variant="outlined"><CardActionArea component="a" href={"#item/" + r.slug} sx={{ p: 1.2 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{r[pf] || r.slug}</Typography>
          </CardActionArea></Card>
        ))}
      </Box>
    </Box>
  );
}

function ItemView({ D, slug }) {
  const node = D.nodes.get(slug);
  if (!node) return <Home D={D} />;
  const rec = node.rec, pType = D.entityToType[node.entity], dtName = titleCase(node.entity);
  const rel = [], long = [], short = [], files = [];
  for (const [k, v] of Object.entries(rec)) {
    if (k === "id" || k === "slug") continue;
    if (isLink(v)) rel.push([k, v]);
    else if (isFile(v)) files.push([k, v]);
    else if (typeof v === "string" && v.trim()) (v.length >= 90 || v.includes("\n") ? long : short).push([k, v]);
    else if (typeof v === "number") short.push([k, String(v)]);
    else if (Array.isArray(v) && v.length && typeof v[0] === "string") short.push([k, v.join(", ")]);
  }
  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1, fontSize: 14 }}>
        <Link href="#" underline="hover">Guide</Link>
        {pType && <Link href={"#type/" + pType} underline="hover">{titleCase(D.types.find((t) => t.slug === pType)["Data Type Name"])}</Link>}
        <Typography sx={{ fontSize: 14 }}>{node.label}</Typography>
      </Breadcrumbs>
      <Chip label={dtName} size="small" sx={{ bgcolor: D.color[node.entity], color: "#fff", fontWeight: 700, mb: 1 }} />
      <Typography variant="h3" sx={{ fontFamily: "Georgia, serif" }}>{node.label}</Typography>
      {long.map(([k, v]) => (
        <Box key={k}>
          <SectionHead>{k}</SectionHead>
          {v.split(/\n+/).filter((p) => p.trim()).map((p, i) => {
            const u = /^https?:\/\//.test(p.trim());
            return <Typography key={i} sx={{ color: "text.secondary", my: 0.4, maxWidth: "70ch" }}>{u ? <Link href={p.trim()} target="_blank" rel="noopener">{p.trim()}</Link> : p.trim()}</Typography>;
          })}
        </Box>
      ))}
      {rel.length > 0 && <><SectionHead>Connections — click any to explore</SectionHead>
        {rel.map(([field, val]) => {
          const chips = val.filter((x) => D.nodes.has(x.slug));
          if (!chips.length) return null;
          return (
            <Box key={field} sx={{ mb: 1.2 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "text.secondary", mt: 1.2, mb: 0.6 }}>{field}</Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.6}>
                {chips.map((x) => {
                  const tn = D.nodes.get(x.slug);
                  return <Chip key={x.slug} clickable component="a" href={"#item/" + x.slug} size="small" variant="outlined" icon={<Dot color={D.color[tn.entity]} />} label={x.label} />;
                })}
              </Stack>
            </Box>
          );
        })}</>}
      {(short.length > 0 || files.length > 0) && <><SectionHead>Details</SectionHead>
        {short.map(([k, v]) => {
          const u = /^https?:\/\//.test(v);
          return <Typography key={k} sx={{ fontSize: 14, color: "text.secondary", mt: 0.4 }}><Box component="b" sx={{ color: "text.primary" }}>{k}:</Box> {u ? <Link href={v} target="_blank" rel="noopener">{v}</Link> : v}</Typography>;
        })}
        {files.map(([k, val]) => (
          <Typography key={k} sx={{ fontSize: 14, color: "text.secondary", mt: 0.4 }}>
            <Box component="b" sx={{ color: "text.primary" }}>{k}:</Box>{" "}
            {val.map((f, i) => <React.Fragment key={i}>{i > 0 ? ", " : ""}<Link href={f.url} target="_blank" rel="noopener">{f.name || "file"}</Link></React.Fragment>)}
          </Typography>
        ))}</>}
    </Box>
  );
}
