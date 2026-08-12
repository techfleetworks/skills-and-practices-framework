import { useState } from "react";
import { AppBar, Toolbar, Box, Button, Menu, MenuItem, Link } from "@mui/material";

// Site-wide navigation from the sitemap:
//   Home · Explore(All of the Data, Career Transitioning) · Resources(API, Ontology)
//   · About · Tech Fleet ↗ · GitHub ↗
// `base` is the relative prefix back to the site root from the current page ("" at root,
// "../" under /learn, /about, /careers) so links stay correct at any depth and portable to a
// custom domain. `children` renders extra toolbar items (e.g. the guide search).
const EXT = {
  techfleet: "https://techfleet.org",
  github: "https://github.com/techfleetworks/skills-and-practices-framework",
};
const linkSx = (on) => ({ color: on ? "primary.main" : "text.primary", fontWeight: 600, textTransform: "none" });
const menuAnchor = { anchorOrigin: { vertical: "bottom", horizontal: "left" }, transformOrigin: { vertical: "top", horizontal: "left" } };

// Defined at module scope (not inside SiteNav) so its identity is stable across renders;
// otherwise React would remount the button on every state change and detach the menu anchor.
function NavLink({ label, href, on, ext }) {
  return (
    <Button size="small" component="a" href={href} target={ext ? "_blank" : undefined} rel={ext ? "noopener" : undefined} sx={linkSx(on)}>
      {label}{ext ? " ↗" : ""}
    </Button>
  );
}

export default function SiteNav({ base = "", active = "", children }) {
  const [explore, setExplore] = useState(null);
  const [resources, setResources] = useState(null);
  const root = base || "./";
  const to = (p) => base + p;
  const exploreActive = active === "explore" || active === "careers";
  const resourcesActive = active === "api" || active === "ontology";
  return (
    <AppBar position="fixed" color="default" elevation={0}
      sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "background.default", zIndex: (t) => t.zIndex.drawer + 1 }}>
      <Toolbar variant="dense" sx={{ gap: 0.5, flexWrap: "wrap" }}>
        <Link href={root} underline="none" color="inherit" sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, mr: 1, whiteSpace: "nowrap" }}>
          Skills &amp; Practices Framework
        </Link>
        {children}
        <Box sx={{ flex: 1, minWidth: 8 }} />
        <NavLink label="Home" href={root} on={active === "home"} />

        <Button size="small" onClick={(e) => setExplore(e.currentTarget)} sx={linkSx(exploreActive)}>Explore ▾</Button>
        <Menu anchorEl={explore} open={!!explore} onClose={() => setExplore(null)} {...menuAnchor}>
          <MenuItem component="a" href={to("explore/")} onClick={() => setExplore(null)}>All of the Data</MenuItem>
          <MenuItem component="a" href={to("careers/")} onClick={() => setExplore(null)}>Career Transitioning</MenuItem>
        </Menu>

        <Button size="small" onClick={(e) => setResources(e.currentTarget)} sx={linkSx(resourcesActive)}>Resources ▾</Button>
        <Menu anchorEl={resources} open={!!resources} onClose={() => setResources(null)} {...menuAnchor}>
          <MenuItem component="a" href={to("api/")} onClick={() => setResources(null)}>API</MenuItem>
          <MenuItem component="a" href={to("ontology/")} onClick={() => setResources(null)}>Ontology</MenuItem>
        </Menu>

        <NavLink label="About" href={to("about/")} on={active === "about"} />
        <NavLink label="Tech Fleet" href={EXT.techfleet} ext />
        <NavLink label="GitHub" href={EXT.github} ext />
      </Toolbar>
    </AppBar>
  );
}
