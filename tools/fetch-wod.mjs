// Fetch Concept2's RowErg Workout of the Day and write wod.json (personal use; credit Concept2).
// Source: the Logbook WOD page https://log.concept2.com/wod/YYYY-MM-DD/rowerg (server-rendered:
//   <h3>title</h3><p><strong>description</strong></p>). concept2.com/wod itself loads dynamically.
// Usage: node tools/fetch-wod.mjs <output wod.json>   (keeps the last 10 days, fetches yesterday..+1 day)
import fs from 'fs';
const out = process.argv[2] || 'wod.json';
let prev = {}; try { prev = JSON.parse(fs.readFileSync(out, 'utf8')); } catch (e) {}
const days = { ...(prev.days || {}) };
const ymd = (d) => d.toISOString().slice(0, 10);
const dec = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
for (const off of [-1, 0, 1]) {
  const d = new Date(Date.now() + off * 86400000), date = ymd(d), url = `https://log.concept2.com/wod/${date}/rowerg`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'CosmicRow personal WOD fetch (github.com/klamintson)' } });
    if (!res.ok) { console.log(date, 'HTTP', res.status); continue; }
    const html = await res.text();
    const h3 = html.match(/<h3>([^<]{2,200})<\/h3>\s*<p>([\s\S]{0,2000}?)<\/p>/i);
    if (!h3) { console.log(date, 'no WOD block found'); continue; }
    days[date] = { title: dec(h3[1]), description: dec(h3[2]), url };
    console.log(date, '=>', days[date].title);
  } catch (e) { console.log(date, 'error', e.message); }
}
const keep = Object.keys(days).sort().slice(-10); const trimmed = {}; for (const k of keep) trimmed[k] = days[k];
const json = { updated: new Date().toISOString(), credit: 'Workout of the Day by Concept2 - https://www.concept2.com/training/wod', erg: 'rowerg', days: trimmed };
fs.writeFileSync(out, JSON.stringify(json, null, 2) + '\n');
