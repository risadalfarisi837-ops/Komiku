const fs = require('fs');
const path = require('path');
const ROUTE = process.argv[2] || '/komikstore';

function walk(d, out = []) {
  if (!fs.existsSync(d)) return out;
  for (const f of fs.readdirSync(d)) {
    if (f === 'node_modules' || f === '.next') continue;
    const p = path.join(d, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(tsx|jsx)$/.test(f)) out.push(p);
  }
  return out;
}

const files = ['app', 'components', 'src'].flatMap((d) => walk(d));
const hit = files.find((f) => {
  const t = fs.readFileSync(f, 'utf8');
  return t.includes('Peringkat') && t.includes('Jelajah') && t.includes('Koleksi');
});
if (!hit) { console.log('GAGAL: file bottom nav tidak ketemu'); process.exit(1); }

let s = fs.readFileSync(hit, 'utf8');
if (s.includes('__hideNav')) { console.log('SKIP: sudah dipatch -> ' + hit); process.exit(0); }

const m = s.match(/export\s+default\s+function\s+(\w+)\s*\(/);
if (!m) { console.log('GAGAL: bukan "export default function" -> kirim isi file ini: ' + hit); process.exit(1); }
const name = m[1];

s = s.replace(m[0], 'function ' + name + 'Inner(');

if (!/^\s*['"]use client['"]/.test(s)) s = "'use client';\n" + s;
if (!/usePathname/.test(s)) {
  const imp = "import { usePathname } from 'next/navigation';\n";
  const i = s.search(/^import /m);
  const at = i < 0 ? s.indexOf('\n') + 1 : i;
  s = s.slice(0, at) + imp + s.slice(at);
}

s += `
export default function ${name}(props: any) {
  const __hideNav = (usePathname() || '').startsWith('${ROUTE}');
  if (__hideNav) return null;
  return <${name}Inner {...props} />;
}
`;
fs.writeFileSync(hit, s);
console.log('OK: ' + hit + ' (hide di ' + ROUTE + ')');
