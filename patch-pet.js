const fs = require('fs');
const p = 'app/komikstore/pet/page.tsx';
let s = fs.readFileSync(p, 'utf8');
if (s.includes('PetArt')) { console.log('SKIP'); process.exit(0); }
let n = 0;
s = s.replace(/(?<![=$\w])\{(\w+(?:\.\w+)*)\.e\}/g, (_, v) => { n++; return '<PetArt e={' + v + '.e} />'; });
if (!n) { console.log('GAGAL: tidak ada {x.e}'); process.exit(1); }
const ms = [...s.matchAll(/^import\s[\s\S]*?from\s+['"][^'"]+['"];?/gm)];
if (!ms.length) { console.log('GAGAL: import'); process.exit(1); }
const l = ms[ms.length - 1], at = l.index + l[0].length;
s = s.slice(0, at) + "\nimport PetArt from '@/components/PetArt';" + s.slice(at);
fs.writeFileSync(p, s);
console.log('OK: ' + n);
