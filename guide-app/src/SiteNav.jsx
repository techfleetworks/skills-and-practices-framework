import { useState } from "react";
import { AppBar, Toolbar, Box, Button, Menu, MenuItem, Link } from "@mui/material";

// Site-wide navigation from the sitemap: Home · Explore · Resources(API, Ontology) · About
// · Tech Fleet ↗ · GitHub ↗. `base` is the relative prefix back to the site root from the
// current page ("" at root, "../" under /learn or /about) so links stay correct at any depth
// and portable to a custom domain. `children` renders extra toolbar items (e.g. the guide search).
const EXT = {
  techfleet: "https://techfleet.org",
  github: "https://github.com/techfleetworks/skills-and-practices-framework",
};

export default function SiteNav({ base = "", active = "", children }) {
  const [anchor, setAnchor] = useState(null);
  const root = base || "./";
  const to = (p) => base + p;
  const NavBtn = ({ label, href, id, ext }) => (
    <Button
      size="small"
      component="a"
      href={href}
      target={ext ? "_blank" : undefined}
      rel={ext ? "noopener" : undefined}
      sx={{ color: active === id ? "primary.main" : "text.primary", fontWeight: 600, textTransform: "none" }}
    >
      {label}{ext ? " ↗" : ""}
    </Button>
  );
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
        <NavBtn label="Home" href={root} id="home" />
        <NavBtn label="Explore" href={to("learn/")} id="explore" />
        <Button size="small" onClick={(e) => setAnchor(e.currentTarget)}
          sx={{ color: resourcesActive ? "primary.main" : "text.primary", fontWeight: 600, textTransform: "none" }}>
          Resources ▾
        </Button>
        <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
          <MenuItem component="a" href={to("api/")} onClick={() => setAnchor(null)}>API</MenuItem>
          <MenuItem component="a" href={to("explore/")} onClick={() => setAnchor(null)}>Ontology</MenuItem>
        </Menu>
        <NavBtn label="About" href={to("about/")} id="about" />
        <NavBtn label="Tech Fleet" href={EXT.techfleet} id="tf" ext />
        <NavBtn label="GitHub" href={EXT.github} id="gh" ext />
      </Toolbar>
    </AppBar>
  );
}
