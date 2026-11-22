// Pemuat Firebase (CDN compat) yang dipakai halaman Pengaturan.
// Aman dipakai bersama halaman Profil: skrip dimuat sekali dan app hanya diinisialisasi sekali.
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAptqYUJWJ-bfadEA5Oa3d5c8YBl8qGzd0",
  authDomain: "komiku-d8788.firebaseapp.com",
  databaseURL: "https://komiku-d8788-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "komiku-d8788",
  storageBucket: "komiku-d8788.firebasestorage.app",
  messagingSenderId: "186745171350",
  appId: "1:186745171350:web:92cd160ed67e25de8801b7",
  measurementId: "G-5FS22L934V"
};

declare global {
  interface Window { firebase: any; _fbReady: boolean; }
}

const FIREBASE_SCRIPTS = [
  'https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.0/firebase-database-compat.js',
];

// Satu skrip hanya dimuat sekali, dan semua pemanggil menunggu skrip yang SAMA sampai benar-benar selesai.
function loadScriptOnce(src: string): Promise<void> {
  const w = window as any;
  w.__fbScripts = w.__fbScripts || {};
  if (w.__fbScripts[src]) return w.__fbScripts[src];
  const p = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.onload = () => resolve();
    s.onerror = () => { delete w.__fbScripts[src]; s.remove(); reject(new Error(`Gagal load: ${src}`)); };
    document.head.appendChild(s);
  });
  w.__fbScripts[src] = p;
  return p;
}

async function loadFirebaseCDN(): Promise<void> {
  if (typeof window === 'undefined') return;
  const ok = () => !!(window.firebase && window.firebase.auth && window.firebase.database);
  if (window._fbReady && ok()) return;
  // berurutan: app dulu, baru auth dan database
  for (const src of FIREBASE_SCRIPTS) await loadScriptOnce(src);
  if (!ok()) throw new Error('Firebase belum lengkap dimuat');
  window._fbReady = true;
}

let _fbPromise: Promise<{ auth: any; db: any }> | null = null;
export function getFirebase() {
  if (_fbPromise) return _fbPromise;
  _fbPromise = (async () => {
    await loadFirebaseCDN();
    if (!window.firebase.apps.length) window.firebase.initializeApp(FIREBASE_CONFIG);
    return { auth: window.firebase.auth(), db: window.firebase.database() };
  })().catch((e) => { _fbPromise = null; throw e; }); // gagal? boleh dicoba lagi, jangan disimpan
  return _fbPromise;
}

export async function loginWithGoogle() {
  const { auth } = await getFirebase();
  const provider = new window.firebase.auth.GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  try {
    await auth.signInWithPopup(provider);
  } catch (popupErr: any) {
    const blocked = ['popup-blocked', 'popup-closed-by-user', 'cancelled-popup-request', 'web-storage-unsupported'];
    if (blocked.some(c => popupErr.code?.includes(c))) await auth.signInWithRedirect(provider);
    else throw popupErr;
  }
}
