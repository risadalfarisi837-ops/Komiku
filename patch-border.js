const fs = require('fs');
const P = 'app/profile/page.tsx';
let s = fs.readFileSync(P, 'utf8');
if (!s.includes('<BorderShopModal')) { console.log('SKIP: sudah dipindah'); process.exit(0); }
const fail = (m) => { console.log('GAGAL: ' + m); process.exit(1); };

const imps = [...s.matchAll(/^import\s[\s\S]*?from\s+['"][^'"]+['"];?[ \t]*$/gm)].map((m) => m[0]);
const rel = imps.filter((i) => /from\s+['"]\.{1,2}\//.test(i));
const okImps = imps.filter((i) => !rel.includes(i));
const re = /^(?:export\s+default\s+)?(?:export\s+)?(?:async\s+)?(?:function|const|let|var|type|interface|enum)\s+(\w+)/gm;
const ms = [...s.matchAll(re)];
const decls = ms.map((m, i) => ({ name: m[1], def: /^export\s+default/.test(m[0]), start: m.index, end: i + 1 < ms.length ? ms[i + 1].index : s.length }));
const by = {};
decls.forEach((d) => { if (!d.def) by[d.name] = d; });
if (!by.BorderShopModal) fail('BorderShopModal tidak ketemu di top-level');
if (!by.BORDER_CATALOG) fail('BORDER_CATALOG tidak ketemu');

const need = new Set(['BorderShopModal', 'BORDER_CATALOG']);
for (let ch = true; ch; ) {
  ch = false;
  for (const n of [...need]) {
    const t = s.slice(by[n].start, by[n].end);
    for (const k in by) if (!need.has(k) && new RegExp('\\b' + k + '\\b').test(t)) { need.add(k); ch = true; }
  }
}
const body = [...need].map((n) => by[n]).sort((a, b) => a.start - b.start)
  .map((d) => s.slice(d.start, d.end).trim().replace(/^export\s+/, '')).join('\n\n');
const comp = "'use client';\n" + okImps.join('\n') + '\n\n' + body + '\n\nexport { BORDER_CATALOG };\nexport default BorderShopModal;\n';

const m = by.BorderShopModal;
let t = s.slice(0, m.start) + s.slice(m.end);
const j = t.search(/\n[ \t]*<BorderShopModal\b/);
if (j < 0) fail('JSX <BorderShopModal> tidak ketemu');
t = t.slice(0, j) + t.slice(t.indexOf('/>', j) + 2);
const ti = t.indexOf('title="Ganti border avatar"');
if (ti >= 0) {
  const rs = t.lastIndexOf('\n', t.lastIndexOf('<MenuRow', ti));
  t = t.slice(0, rs) + t.slice(t.indexOf('/>', ti) + 2);
} else console.log('PERINGATAN: baris "Ganti border avatar" tidak ketemu');
t = t.replace(/setBorderShopOpen\(true\)/g, 'void 0');

fs.writeFileSync('components/BorderSheet.tsx', comp);
fs.writeFileSync(P, t);

const K = 'app/komikstore/page.tsx';
let k = fs.readFileSync(K, 'utf8');
const r = /(title:\s*'Avatar Border',\s*sub:\s*'[^']*',)/;
if (k.includes('avatar-border')) console.log('kartu menu: sudah ada href');
else if (r.test(k)) { fs.writeFileSync(K, k.replace(r, "$1 href: '/komikstore/avatar-border',")); console.log('kartu menu: href dipasang'); }
else console.log('PERINGATAN: kartu Avatar Border tidak ketemu');
if (rel.length) console.log('Import relatif tidak disalin: ' + rel.length);
console.log('OK, ikut dipindah: ' + [...need].join(', '));
