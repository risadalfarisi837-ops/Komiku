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

function loadFirebaseCDN(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window._fbReady) return Promise.resolve();
  const scripts = [
    'https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.14.0/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/10.14.0/firebase-database-compat.js',
  ];
  return scripts.reduce((chain, src) => chain.then(() => new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Gagal load: ${src}`));
    document.head.appendChild(s);
  })), Promise.resolve()).then(() => { window._fbReady = true; });
}

let _fbPromise: Promise<{ auth: any; db: any }> | null = null;
export function getFirebase() {
  if (_fbPromise) return _fbPromise;
  _fbPromise = (async () => {
    await loadFirebaseCDN();
    if (!window.firebase.apps.length) window.firebase.initializeApp(FIREBASE_CONFIG);
    return { auth: window.firebase.auth(), db: window.firebase.database() };
  })();
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
