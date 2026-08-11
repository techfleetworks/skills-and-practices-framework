// Shared: fetch the live snapshot and turn it into {nodes, links} for any graph library.
// Called from a page one level deeper (previews/<lib>/), so data is two levels up.
async function loadSPF(){
  const snap = await (await fetch("../../data/json/framework.snapshot.json")).json();
  const ents = snap.entities.filter(e => e.file.startsWith("framework-data/"));
  const color = {}, primary = {};
  ents.forEach((e,i)=>{ color[e.entity] = `hsl(${Math.round((i*360/ents.length)+15)%360} 62% 55%)`; primary[e.entity] = e.primaryField; });
  const isLink = v => Array.isArray(v) && v.length && v[0] && typeof v[0]==="object" && "slug" in v[0];
  const nodes = new Map();
  for (const e of ents) for (const r of (snap.data[e.entity]||[])) {
    if (!r.slug || nodes.has(r.slug)) continue;
    nodes.set(r.slug, { id:r.slug, label:r[e.primaryField]||r.slug, type:e.entity, color:color[e.entity] });
  }
  const links = [], seen = new Set();
  for (const e of ents) for (const r of (snap.data[e.entity]||[])) {
    if (!r.slug) continue;
    for (const val of Object.values(r)) {
      if (!isLink(val)) continue;
      for (const t of val) {
        if (!nodes.has(t.slug)) continue;
        const k = r.slug+"|"+t.slug; if (seen.has(k)) continue; seen.add(k);
        links.push({ source:r.slug, target:t.slug });
      }
    }
  }
  return { ents, color, nodes:[...nodes.values()], links };
}
