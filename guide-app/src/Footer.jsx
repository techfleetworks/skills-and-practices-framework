import { Box, Container, Typography, Link, Stack, Divider } from "@mui/material";

const GH = "https://github.com/techfleetworks/skills-and-practices-framework";

// Shared footer: mission line, the sitemap's links, and the license. `base` keeps internal
// links correct at any page depth ("" at root, "../" under /learn or /about).
export default function Footer({ base = "" }) {
  const root = base || "./";
  const to = (p) => base + p;
  return (
    <Box component="footer" sx={{ borderTop: 1, borderColor: "divider", mt: 8, py: 5 }}>
      <Container sx={{ maxWidth: "1040px !important" }}>
        <Typography variant="h6" sx={{ mb: 0.5 }}>Skills &amp; Practices Framework</Typography>
        <Typography sx={{ color: "text.secondary", maxWidth: "60ch", mb: 2 }}>
          Created and maintained by Tech Fleet, a public charity on a mission to build empowered
          team spaces in the world. Open data for professional development and career success.
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={2} sx={{ mb: 2 }}>
          <Link href={root} underline="hover">Home</Link>
          <Link href={to("learn/")} underline="hover">All of the Data</Link>
          <Link href={to("careers/")} underline="hover">Career Transitioning</Link>
          <Link href={to("explore/")} underline="hover">Ontology</Link>
          <Link href={to("api/")} underline="hover">API</Link>
          <Link href={to("about/")} underline="hover">About</Link>
          <Link href="https://techfleet.org" target="_blank" rel="noopener" underline="hover">Tech Fleet ↗</Link>
          <Link href={GH} target="_blank" rel="noopener" underline="hover">GitHub ↗</Link>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
          Data licensed under{" "}
          <Link href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</Link>
          ; the code that builds it under Apache 2.0. Free to use, share, and build on with credit.
        </Typography>
      </Container>
    </Box>
  );
}
