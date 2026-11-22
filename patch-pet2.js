const fs = require('fs');
const p = 'app/komikstore/pet/page.tsx';
let s = fs.readFileSync(p, 'utf8');
const old = "<span style={{ fontSize: size * 0.8, lineHeight: 1 }}>{s.e}</span>";
if (!s.includes(old)) { console.log('GAGAL: baris emoji tidak ketemu'); process.exit(1); }
s = s.replace(old, "<span style={{ fontSize: size * 0.8, lineHeight: 1, display: 'inline-flex' }}><PetSvg e={s.e} ground={size >= 64} /></span>");
const ms = [...s.matchAll(/^import\s[\s\S]*?from\s+['"][^'"]+['"];?/gm)];
const l = ms[ms.length - 1], at = l.index + l[0].length;
s = s.slice(0, at) + "\nimport PetSvg from '@/components/PetArt';" + s.slice(at);
fs.writeFileSync(p, s);
console.log('OK');
