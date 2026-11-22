const eye = (x: number, y = 44, r = 5, iris = '#1f2937') =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${x + 0.8}" cy="${y + 0.8}" r="${r * 0.65}" fill="${iris}"/><circle cx="${x + 2}" cy="${y - 0.6}" r="${r * 0.26}" fill="#fff"/>`;
const eyes = (y = 44, gap = 11, r = 5, iris?: string) => eye(50 - gap, y, r, iris) + eye(50 + gap, y, r, iris);
const catEye = (x: number, y: number, r = 5) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="#fde047"/><ellipse cx="${x}" cy="${y}" rx="1.5" ry="${r * 0.85}" fill="#111827"/><circle cx="${x + 1.8}" cy="${y - 1.5}" r="1.2" fill="#fff"/>`;
const cheeks = (y = 52) => `<ellipse cx="33" cy="${y}" rx="4" ry="2.6" fill="#fb7185" opacity=".4"/><ellipse cx="67" cy="${y}" rx="4" ry="2.6" fill="#fb7185" opacity=".4"/>`;
const nose = (y = 50, c = '#5b3a29') => `<ellipse cx="50" cy="${y}" rx="3" ry="2.2" fill="${c}"/>`;
const smile = (y = 54) => `<path d="M44 ${y} Q50 ${y + 5} 56 ${y}" stroke="#4b2e1f" stroke-width="1.7" fill="none" stroke-linecap="round"/>`;
const whisk = () => `<path d="M31 52 L19 50 M31 55 L19 57 M69 52 L81 50 M69 55 L81 57" stroke="#6b7280" stroke-width="1.2" stroke-linecap="round"/>`;
const body = (c: string, c2: string) => `<ellipse cx="50" cy="68" rx="24" ry="19" fill="${c}"/><ellipse cx="50" cy="72" rx="15" ry="12" fill="${c2}"/>`;
const head = (c: string) => `<circle cx="50" cy="44" r="22" fill="${c}"/>`;
const feet = (c: string) => `<ellipse cx="38" cy="85" rx="8" ry="4.5" fill="${c}"/><ellipse cx="62" cy="85" rx="8" ry="4.5" fill="${c}"/>`;
const earsRound = (c: string, i: string) =>
  `<circle cx="33" cy="26" r="8" fill="${c}"/><circle cx="67" cy="26" r="8" fill="${c}"/><circle cx="33" cy="26" r="4.5" fill="${i}"/><circle cx="67" cy="26" r="4.5" fill="${i}"/>`;
const earsPoint = (c: string, i: string) =>
  `<path d="M30 34 L31 12 L46 25Z" fill="${c}"/><path d="M70 34 L69 12 L54 25Z" fill="${c}"/><path d="M33 29 L34 18 L42 25Z" fill="${i}"/><path d="M67 29 L66 18 L58 25Z" fill="${i}"/>`;
const tail = (c: string, d = 'M72 72 Q92 68 86 46', w = 7, px = 72, py = 72) =>
  `<g><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/><animateTransform attributeName="transform" type="rotate" values="-6 ${px} ${py};8 ${px} ${py};-6 ${px} ${py}" dur="2.4s" repeatCount="indefinite"/></g>`;

const dragon = (c: string, c2: string, h: string) =>
  tail(c, 'M72 74 Q94 74 88 54') +
  `<path d="M28 62 Q6 52 10 32 Q24 40 34 54Z" fill="${c2}"/><path d="M72 62 Q94 52 90 32 Q76 40 66 54Z" fill="${c2}"/>` +
  body(c, c2) + feet(c) + head(c) +
  `<path d="M32 30 L26 8 L43 23Z" fill="${h}"/><path d="M68 30 L74 8 L57 23Z" fill="${h}"/>` +
  `<ellipse cx="50" cy="54" rx="12" ry="8" fill="${c2}"/><circle cx="45.5" cy="53" r="1.5" fill="#14532d"/><circle cx="54.5" cy="53" r="1.5" fill="#14532d"/>` +
  eyes(41, 12, 5, '#b45309') +
  `<path d="M44 59 Q50 63 56 59" stroke="#14532d" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M44 59 L45.5 62 L47 59Z M53 59 L54.5 62 L56 59Z" fill="#fff"/>`;

const lizard = () =>
  tail('#65a30d', 'M72 76 Q96 78 90 56', 8) + body('#84cc16', '#d9f99d') + feet('#65a30d') +
  `<path d="M40 26 L43 16 L47 24 L51 14 L55 24 L59 16 L61 27Z" fill="#65a30d"/>` + head('#84cc16') +
  `<circle cx="38" cy="66" r="2.5" fill="#65a30d"/><circle cx="60" cy="62" r="3" fill="#65a30d"/><circle cx="52" cy="75" r="2.2" fill="#65a30d"/>` +
  eyes(40, 12, 5.5, '#92400e') + smile(53) +
  `<path d="M50 56 V64 M50 64 L47 67 M50 64 L53 67" stroke="#ef4444" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;

const whale = () =>
  `<g><path d="M78 62 Q96 50 92 34 Q84 42 78 46 Q86 36 84 24 Q72 38 68 56Z" fill="#2563eb"/><animateTransform attributeName="transform" type="rotate" values="-5 76 60;6 76 60;-5 76 60" dur="2.6s" repeatCount="indefinite"/></g>` +
  `<ellipse cx="46" cy="64" rx="34" ry="23" fill="#3b82f6"/>` +
  `<path d="M14 68 Q46 96 78 68 Q70 84 46 86 Q22 84 14 68Z" fill="#e0f2fe"/>` +
  `<path d="M38 38 Q36 28 28 24 M40 38 Q44 28 52 24" stroke="#bae6fd" stroke-width="3" fill="none" stroke-linecap="round"><animate attributeName="opacity" values="1;.35;1" dur="2s" repeatCount="indefinite"/></path>` +
  eye(30, 58, 5) + `<ellipse cx="22" cy="66" rx="4" ry="2.6" fill="#fb7185" opacity=".4"/>` +
  `<path d="M24 70 Q31 75 38 70" stroke="#1e3a8a" stroke-width="1.7" fill="none" stroke-linecap="round"/>`;

const frog = () =>
  body('#4ade80', '#bbf7d0') + feet('#22c55e') +
  `<ellipse cx="50" cy="46" rx="24" ry="19" fill="#4ade80"/><circle cx="35" cy="28" r="10" fill="#4ade80"/><circle cx="65" cy="28" r="10" fill="#4ade80"/>` +
  eye(35, 28, 6) + eye(65, 28, 6) + cheeks(52) +
  `<circle cx="47" cy="45" r="1.2" fill="#166534"/><circle cx="53" cy="45" r="1.2" fill="#166534"/><path d="M36 52 Q50 64 64 52" stroke="#166534" stroke-width="2" fill="none" stroke-linecap="round"/>`;

const penguin = () =>
  `<ellipse cx="25" cy="60" rx="6" ry="14" fill="#1e293b" transform="rotate(20 25 60)"/><ellipse cx="75" cy="60" rx="6" ry="14" fill="#1e293b" transform="rotate(-20 75 60)"/>` +
  `<ellipse cx="50" cy="56" rx="26" ry="32" fill="#1e293b"/><ellipse cx="50" cy="66" rx="18" ry="22" fill="#f8fafc"/>` +
  `<ellipse cx="38" cy="86" rx="9" ry="4" fill="#fb923c"/><ellipse cx="62" cy="86" rx="9" ry="4" fill="#fb923c"/>` +
  `<ellipse cx="50" cy="42" rx="17" ry="12" fill="#f8fafc"/>` + eyes(40, 9, 4.5) +
  `<path d="M44 47 L50 55 L56 47 Q50 43 44 47Z" fill="#fb923c"/>` + cheeks(50);

const blackcat = () =>
  tail('#1f2937', 'M72 74 Q94 72 88 48') + body('#1f2937', '#374151') + feet('#1f2937') +
  earsPoint('#1f2937', '#f9a8d4') + head('#1f2937') + catEye(39, 44, 5.5) + catEye(61, 44, 5.5) +
  nose(51, '#f9a8d4') + smile(55) + whisk();

const trex = () =>
  tail('#f97316', 'M72 76 Q98 76 92 52', 9) +
  `<path d="M40 26 L44 14 L48 24 L52 12 L56 24 L60 14 L62 28Z" fill="#c2410c"/>` +
  body('#fb923c', '#fed7aa') + feet('#ea580c') + head('#fb923c') +
  `<ellipse cx="33" cy="68" rx="4" ry="3" fill="#fb923c"/><ellipse cx="67" cy="68" rx="4" ry="3" fill="#fb923c"/>` +
  eyes(40, 12, 5) + `<circle cx="46" cy="49" r="1.3" fill="#9a3412"/><circle cx="54" cy="49" r="1.3" fill="#9a3412"/>` +
  `<path d="M38 55 Q50 66 62 55Z" fill="#7f1d1d"/><path d="M41 56 L43.5 61 L46 57Z M54 57 L56.5 61 L59 56Z" fill="#fff"/>`;

const manePuffs = () =>
  Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    return `<circle cx="${50 + Math.cos(a) * 27}" cy="${44 + Math.sin(a) * 27}" r="9" fill="#b45309"/>`;
  }).join('');
const lion = () =>
  tail('#d97706', 'M72 74 Q94 72 88 50') + body('#fbbf24', '#fde68a') + feet('#f59e0b') +
  `<circle cx="50" cy="44" r="28" fill="#b45309"/>` + manePuffs() + earsRound('#fbbf24', '#92400e') + head('#fcd34d') +
  `<ellipse cx="50" cy="53" rx="11" ry="8" fill="#fef3c7"/>` + eyes(41, 10, 4.5) + nose(49, '#7c2d12') + smile(54);

const unicorn = () =>
  `<path d="M72 78 Q98 76 90 54 Q82 62 76 66Z" fill="#f472b6"/>` +
  `<path d="M30 28 Q10 40 18 66 Q30 56 32 44Z" fill="#f472b6"/><path d="M70 28 Q90 40 82 66 Q70 56 68 44Z" fill="#f472b6"/>` +
  body('#f8fafc', '#e0e7ff') + feet('#e2e8f0') +
  `<path d="M31 32 L32 12 L46 24Z" fill="#f8fafc"/><path d="M69 32 L68 12 L54 24Z" fill="#f8fafc"/>` + head('#f8fafc') +
  `<path d="M50 3 L44 28 L56 28Z" fill="#fbbf24"/><path d="M47 14 L53 16 M46 20 L54 22" stroke="#f59e0b" stroke-width="1.5"/>` +
  `<path d="M36 28 Q50 16 64 28 Q50 24 36 28Z" fill="#f472b6"/>` +
  eyes(44, 11, 5, '#7c3aed') + cheeks(52) + `<circle cx="47" cy="54" r="1.2" fill="#f472b6"/><circle cx="53" cy="54" r="1.2" fill="#f472b6"/>` + smile(57);

const snake = () =>
  `<ellipse cx="50" cy="78" rx="32" ry="11" fill="#16a34a"/><ellipse cx="50" cy="68" rx="25" ry="10" fill="#22c55e"/><ellipse cx="50" cy="58" rx="19" ry="9" fill="#4ade80"/>` +
  `<path d="M28 76 l4 6 M42 80 l3 6 M58 80 l-3 6 M72 76 l-4 6 M34 66 l3 5 M66 66 l-3 5" stroke="#15803d" stroke-width="2.5" stroke-linecap="round"/>` +
  `<circle cx="50" cy="40" r="19" fill="#4ade80"/>` + eyes(38, 9, 4.5, '#a16207') + cheeks(46) + smile(49) +
  `<path d="M50 53 V60 M50 60 L47 63 M50 60 L53 63" stroke="#ef4444" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;

const butterfly = () =>
  `<g transform="translate(50 52)"><g><animateTransform attributeName="transform" type="scale" values="1 1;.82 1;1 1" dur="1.4s" repeatCount="indefinite"/>` +
  `<ellipse cx="-22" cy="-12" rx="22" ry="20" transform="rotate(-25 -22 -12)" fill="#a78bfa"/><ellipse cx="22" cy="-12" rx="22" ry="20" transform="rotate(25 22 -12)" fill="#a78bfa"/>` +
  `<ellipse cx="-17" cy="18" rx="15" ry="13" transform="rotate(20 -17 18)" fill="#f9a8d4"/><ellipse cx="17" cy="18" rx="15" ry="13" transform="rotate(-20 17 18)" fill="#f9a8d4"/>` +
  `<circle cx="-24" cy="-14" r="7" fill="#fff" opacity=".7"/><circle cx="24" cy="-14" r="7" fill="#fff" opacity=".7"/><circle cx="-17" cy="18" r="4.5" fill="#fff" opacity=".7"/><circle cx="17" cy="18" r="4.5" fill="#fff" opacity=".7"/></g>` +
  `<ellipse cx="0" cy="4" rx="5" ry="22" fill="#7c2d12"/><circle cx="0" cy="-20" r="7" fill="#7c2d12"/>` +
  `<path d="M-2 -26 Q-8 -38 -14 -36 M2 -26 Q8 -38 14 -36" stroke="#7c2d12" stroke-width="1.8" fill="none" stroke-linecap="round"/>` +
  `<circle cx="-2.5" cy="-20" r="1.8" fill="#fff"/><circle cx="2.5" cy="-20" r="1.8" fill="#fff"/></g>`;

const sauro = () =>
  tail('#14b8a6', 'M30 76 Q8 78 12 58', 9, 30, 76) +
  `<path d="M62 62 Q74 52 70 26" stroke="#2dd4bf" stroke-width="13" fill="none" stroke-linecap="round"/>` +
  `<ellipse cx="46" cy="70" rx="28" ry="17" fill="#2dd4bf"/><ellipse cx="46" cy="76" rx="18" ry="10" fill="#99f6e4"/>` +
  `<rect x="26" y="78" width="10" height="9" rx="4" fill="#14b8a6"/><rect x="56" y="78" width="10" height="9" rx="4" fill="#14b8a6"/>` +
  `<circle cx="36" cy="64" r="3" fill="#14b8a6"/><circle cx="52" cy="60" r="3.5" fill="#14b8a6"/>` +
  `<circle cx="70" cy="22" r="11" fill="#2dd4bf"/>` + eye(66, 20, 4.5) +
  `<path d="M68 27 Q73 30 78 26" stroke="#0f766e" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;

const croc = () =>
  tail('#15803d', 'M26 74 Q6 76 10 60', 10, 26, 74) +
  `<ellipse cx="42" cy="70" rx="30" ry="15" fill="#22c55e"/><ellipse cx="42" cy="76" rx="20" ry="8" fill="#bbf7d0"/>` +
  `<path d="M24 58 L28 49 L32 58Z M38 56 L42 47 L46 56Z M52 56 L56 47 L60 56Z" fill="#15803d"/>` +
  `<ellipse cx="28" cy="85" rx="7" ry="4" fill="#15803d"/><ellipse cx="56" cy="85" rx="7" ry="4" fill="#15803d"/>` +
  `<ellipse cx="72" cy="58" rx="20" ry="12" fill="#22c55e"/><circle cx="64" cy="48" r="7" fill="#22c55e"/>` + eye(64, 48, 4.5) +
  `<circle cx="86" cy="54" r="1.4" fill="#14532d"/><path d="M56 62 Q74 70 91 60" stroke="#14532d" stroke-width="1.6" fill="none" stroke-linecap="round"/>` +
  `<path d="M64 64 L66 68 L68 65Z M76 66 L78 69 L80 65Z" fill="#fff"/>`;

const tiger = () =>
  tail('#fb923c', 'M72 74 Q94 72 88 48') +
  `<path d="M80 62 L86 65 M86 56 L92 58" stroke="#1f2937" stroke-width="2.5" stroke-linecap="round"/>` +
  body('#fb923c', '#fff7ed') + feet('#fb923c') +
  `<path d="M30 60 L36 63 M28 70 L35 72 M70 60 L64 63 M72 70 L65 72" stroke="#1f2937" stroke-width="2.8" stroke-linecap="round"/>` +
  earsRound('#fb923c', '#1f2937') + head('#fb923c') +
  `<path d="M50 24 V32 M42 25 L44 32 M58 25 L56 32 M29 42 L36 44 M29 50 L36 49 M71 42 L64 44 M71 50 L64 49" stroke="#1f2937" stroke-width="2.6" stroke-linecap="round"/>` +
  `<ellipse cx="50" cy="53" rx="11" ry="8" fill="#fff7ed"/>` + eyes(42, 11, 4.5, '#15803d') + nose(49, '#f472b6') + smile(54) + whisk();

const parrot = () =>
  `<path d="M42 78 Q40 92 46 94 Q50 86 50 78Z" fill="#ef4444"/><path d="M58 78 Q60 92 54 94 Q50 86 50 78Z" fill="#3b82f6"/>` +
  `<ellipse cx="27" cy="66" rx="8" ry="16" fill="#2563eb" transform="rotate(10 27 66)"/><ellipse cx="73" cy="66" rx="8" ry="16" fill="#2563eb" transform="rotate(-10 73 66)"/>` +
  body('#22c55e', '#bbf7d0') + feet('#fb923c') +
  `<path d="M42 26 Q44 8 50 5 Q56 8 58 26Z" fill="#ef4444"/>` + head('#22c55e') +
  `<ellipse cx="50" cy="44" rx="17" ry="13" fill="#f0fdf4"/>` + eyes(42, 10, 5) +
  `<path d="M43 47 Q50 42 57 47 Q57 58 50 60 Q43 58 43 47Z" fill="#fb923c"/><path d="M45 54 Q50 57 55 54" stroke="#c2410c" stroke-width="1.3" fill="none"/>`;

const bat = () =>
  `<g><path d="M32 60 Q4 56 2 30 Q12 38 18 34 Q22 44 30 42 Q30 50 36 52Z" fill="#6d28d9"/><path d="M68 60 Q96 56 98 30 Q88 38 82 34 Q78 44 70 42 Q70 50 64 52Z" fill="#6d28d9"/><animateTransform attributeName="transform" type="rotate" values="-3 50 56;4 50 56;-3 50 56" dur="1.6s" repeatCount="indefinite"/></g>` +
  body('#7c3aed', '#c4b5fd') + feet('#5b21b6') +
  `<path d="M30 34 L28 10 L44 24Z" fill="#7c3aed"/><path d="M70 34 L72 10 L56 24Z" fill="#7c3aed"/><path d="M32 28 L31 16 L40 24Z" fill="#f9a8d4"/><path d="M68 28 L69 16 L60 24Z" fill="#f9a8d4"/>` +
  head('#7c3aed') + eyes(43, 11, 5, '#be123c') + nose(51, '#4c1d95') + smile(55) +
  `<path d="M45 55 L46.5 59 L48 55Z M52 55 L53.5 59 L55 55Z" fill="#fff"/>`;

const scorp = () =>
  `<path d="M62 74 Q94 74 88 44 Q86 34 76 36" stroke="#ea580c" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M76 36 L70 40 L78 45Z" fill="#7c2d12"/>` +
  `<path d="M34 76 L22 86 M40 80 L32 90 M60 80 L68 90 M66 76 L78 86" stroke="#9a3412" stroke-width="3" stroke-linecap="round"/>` +
  `<ellipse cx="50" cy="66" rx="24" ry="17" fill="#f97316"/><ellipse cx="50" cy="72" rx="15" ry="9" fill="#fdba74"/>` +
  `<path d="M38 60 Q50 66 62 60 M36 68 Q50 74 64 68" stroke="#c2410c" stroke-width="1.6" fill="none"/>` +
  `<path d="M30 52 Q8 50 12 32 Q22 34 24 42 Q28 40 34 44Z" fill="#ea580c"/><path d="M70 52 Q92 50 88 32 Q78 34 76 42 Q72 40 66 44Z" fill="#ea580c"/>` +
  `<circle cx="50" cy="46" r="17" fill="#f97316"/>` + eyes(44, 9, 4.5) + cheeks(51) + smile(52);

const fox = () =>
  `<g><path d="M70 76 Q100 76 92 42 Q82 54 72 64Z" fill="#f97316"/><path d="M92 42 Q94 52 86 58 Q86 48 92 42Z" fill="#fff"/><animateTransform attributeName="transform" type="rotate" values="-5 70 76;7 70 76;-5 70 76" dur="2.4s" repeatCount="indefinite"/></g>` +
  body('#f97316', '#fff7ed') + feet('#7c2d12') + earsPoint('#f97316', '#292524') + head('#f97316') +
  `<path d="M28 46 Q50 72 72 46 Q60 58 50 58 Q40 58 28 46Z" fill="#fff"/>` + eyes(42, 11, 4.5) + nose(52, '#1c1917') +
  `<path d="M46 56 Q50 59 54 56" stroke="#4b2e1f" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;

const tanuki = () =>
  tail('#78716c', 'M72 74 Q94 72 88 48', 10) +
  `<path d="M80 68 L87 65 M86 60 L93 58 M88 52 L94 52" stroke="#292524" stroke-width="3" stroke-linecap="round"/>` +
  body('#a8a29e', '#e7e5e4') + feet('#44403c') + earsRound('#78716c', '#292524') + head('#a8a29e') +
  `<ellipse cx="38" cy="44" rx="10" ry="8" fill="#292524" transform="rotate(-20 38 44)"/><ellipse cx="62" cy="44" rx="10" ry="8" fill="#292524" transform="rotate(20 62 44)"/>` +
  `<ellipse cx="50" cy="54" rx="10" ry="7" fill="#f5f5f4"/>` + eyes(44, 11, 4) + nose(51, '#1c1917') + smile(55);

const cat2 = () =>
  tail('#fdba74', 'M72 74 Q94 72 88 46') + tail('#fb923c', 'M70 76 Q100 70 96 50', 7, 70, 76) +
  `<path d="M88 46 q-4 -8 0 -14 q4 6 0 14Z" fill="#60a5fa"/><path d="M96 50 q-4 -8 0 -14 q4 6 0 14Z" fill="#38bdf8"/>` +
  body('#fdba74', '#fff7ed') + feet('#fdba74') + earsPoint('#fdba74', '#f9a8d4') + head('#fdba74') +
  `<path d="M50 24 V31 M43 25 L45 31 M57 25 L55 31" stroke="#ea580c" stroke-width="2.5" stroke-linecap="round"/>` +
  eyes(44, 11, 5, '#0ea5e9') + nose(51, '#f472b6') + smile(54) + whisk();

const blob = (k: string) => {
  const h = (k.codePointAt(0) || 0) % 360;
  const c = `hsl(${h} 70% 60%)`, c2 = `hsl(${h} 80% 82%)`;
  return tail(c) + body(c, c2) + feet(c) + earsRound(c, c2) + head(c) + eyes(44) + cheeks() + smile(53);
};

const G = (a: string, b: string, extra = '') =>
  `<ellipse cx="50" cy="88" rx="40" ry="8" fill="${a}"/><ellipse cx="50" cy="86.5" rx="35" ry="5.5" fill="${b}"/>` + extra;
const GROUND: Record<string, string> = {
  grass: G('#4ade80', '#86efac', `<path d="M18 86 L20 78 L23 86 M78 87 L81 78 L84 87" stroke="#16a34a" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="25" cy="85" r="2" fill="#fde047"/><circle cx="72" cy="86" r="2" fill="#f9a8d4"/>`),
  forest: G('#15803d', '#22c55e', `<path d="M10 84 L17 64 L24 84Z" fill="#166534"/><path d="M13 76 L17 60 L21 76Z" fill="#15803d"/><circle cx="80" cy="85" r="2.5" fill="#ef4444"/><circle cx="85" cy="87" r="2" fill="#fde047"/>`),
  savanna: G('#d6a756', '#f3d27a', `<path d="M16 86 L18 78 L21 86 M78 87 L81 79 L84 87" stroke="#a16207" stroke-width="2" fill="none" stroke-linecap="round"/><rect x="85" y="68" width="2.5" height="14" fill="#78350f"/><ellipse cx="86" cy="66" rx="9" ry="4" fill="#4d7c0f"/>`),
  sand: G('#e8c27a', '#fde7a6', `<rect x="12" y="70" width="6" height="16" rx="3" fill="#16a34a"/><rect x="7" y="74" width="4" height="8" rx="2" fill="#16a34a"/><rect x="7" y="78" width="9" height="3" fill="#16a34a"/>`),
  ice: G('#93c5fd', '#e0f2fe', `<path d="M12 86 L16 68 L21 86Z" fill="#bae6fd"/><path d="M80 86 L85 64 L90 86Z" fill="#7dd3fc"/>`),
  water: G('#0ea5e9', '#38bdf8', `<path d="M20 87 q4 -3 8 0 M70 89 q4 -3 8 0" stroke="#e0f2fe" stroke-width="1.6" fill="none" stroke-linecap="round"/>`),
  lava: `<ellipse cx="50" cy="88" rx="40" ry="8" fill="#44403c"/><ellipse cx="50" cy="86.5" rx="34" ry="5.5" fill="#f97316"><animate attributeName="opacity" values=".75;1;.75" dur="2s" repeatCount="indefinite"/></ellipse><path d="M12 86 L19 70 L26 86Z" fill="#57534e"/><circle cx="82" cy="83" r="2" fill="#fbbf24"/>`,
  cloud: `<ellipse cx="50" cy="88" rx="40" ry="8" fill="#e0f2fe"/><circle cx="24" cy="85" r="7" fill="#fff"/><circle cx="76" cy="85" r="8" fill="#fff"/><ellipse cx="50" cy="86.5" rx="34" ry="6" fill="#fff"/><path d="M86 66 l1.5 4 l4 1.5 l-4 1.5 l-1.5 4 l-1.5 -4 l-4 -1.5 l4 -1.5Z" fill="#fde68a"/>`,
  swamp: G('#365314', '#65a30d', `<ellipse cx="22" cy="86" rx="6" ry="2.5" fill="#4d7c0f"/><rect x="84" y="70" width="2" height="14" fill="#a16207"/><ellipse cx="85" cy="68" rx="3" ry="5" fill="#92400e"/>`),
  night: G('#312e81', '#4338ca', `<path d="M82 66 a7 7 0 1 0 6 10 a5.5 5.5 0 0 1 -6 -10Z" fill="#fde68a"/>`),
};

const SP: Record<string, [string, string]> = {
  '🐲': [dragon('#22c55e', '#bbf7d0', '#fbbf24'), 'forest'],
  '🐉': [dragon('#60a5fa', '#dbeafe', '#e0f2fe'), 'ice'],
  '🦎': [lizard(), 'sand'],
  '🐋': [whale(), 'water'],
  '🐸': [frog(), 'swamp'],
  '🐧': [penguin(), 'ice'],
  '🐈': [blackcat(), 'night'],
  '🦖': [trex(), 'lava'],
  '🦁': [lion(), 'savanna'],
  '🦄': [unicorn(), 'cloud'],
  '🐍': [snake(), 'forest'],
  '🦋': [butterfly(), 'grass'],
  '🦕': [sauro(), 'forest'],
  '🐊': [croc(), 'swamp'],
  '🐅': [tiger(), 'forest'],
  '🦜': [parrot(), 'forest'],
  '🦇': [bat(), 'night'],
  '🦂': [scorp(), 'sand'],
  '🦊': [fox(), 'forest'],
  '🦝': [tanuki(), 'forest'],
  '🐱': [cat2(), 'grass'],
};

export default function PetArt({ e, ground = true }: { e: string; ground?: boolean }) {
  const k = Array.from(e || '')[0] || '';
  const hit = SP[k];
  const art = hit ? hit[0] : blob(k);
  const g = hit ? hit[1] : 'grass';
  const html =
    (ground ? GROUND[g] : '') +
    `<g><animateTransform attributeName="transform" type="translate" values="0 0;0 -1.6;0 0" dur="2.6s" repeatCount="indefinite"/>${art}</g>`;
  return (
    <svg viewBox="0 0 100 100" width="1.4em" height="1.4em" aria-hidden="true"
      style={{ display: 'inline-block', overflow: 'visible', verticalAlign: 'middle' }}
      dangerouslySetInnerHTML={{ __html: html }} />
  );
}
