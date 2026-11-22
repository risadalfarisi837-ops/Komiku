'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebase } from '@/lib/leaderboard';
import { KomoFace, REACTIONS, ReactionKey } from '@/components/KomoReaction';

export default function ChapterEnd({ chapterUrl, chNum, thumb, nextLink, mangaLink, komentarHref, onNext }: {
    chapterUrl: string; chNum: string; thumb: string; nextLink: string | null; mangaLink: string | null;
    komentarHref: string; onNext: () => void;
}) {
    const key = chapterUrl.replace(/[.#$[\]/]/g, '_').slice(-120);
    const [react, setReact] = useState<Record<string, string>>({});
    const [uid, setUid] = useState<string | null>(null);
    const [commentCount, setCommentCount] = useState<number | null>(null);
    const [nextLabel, setNextLabel] = useState('');
    const [msg, setMsg] = useState('');
    const router = useRouter();
    const dbRef = useRef<any>(null);
    const authRef = useRef<any>(null);

    useEffect(() => {
        let offs: Array<() => void> = [];
        getFirebase().then(({ auth, db }) => {
            authRef.current = auth; dbRef.current = db;
            auth.onAuthStateChanged((u: any) => setUid(u ? u.uid : null));
            const r1 = db.ref(`chapterReactions/${key}`);
            const c1 = (s: any) => setReact(s.val() || {});
            r1.on('value', c1, () => {});
            offs.push(() => r1.off('value', c1));
            const r2 = db.ref(`chapterComments/${key}`);
            const c2 = (s: any) => setCommentCount(s.numChildren());
            r2.on('value', c2, () => {});
            offs.push(() => r2.off('value', c2));
        });
        return () => offs.forEach((f) => f());
    }, [key]);

    useEffect(() => {
        if (!nextLink || !mangaLink) return;
        let alive = true;
        fetch(`/api/manga/detail?url=${encodeURIComponent(mangaLink)}`).then((r) => r.json()).then((j) => {
            const list: { title: string; link: string }[] = j?.data?.chapters || [];
            const hit = list.find((c) => c.link === nextLink);
            const m = hit?.title?.match(/\d+(?:\.\d+)?/);
            if (alive && m) setNextLabel(`Ch. ${m[0]}`);
        }).catch(() => {});
        return () => { alive = false; };
    }, [nextLink, mangaLink]);

    const counts: Record<string, number> = {};
    Object.values(react).forEach((t) => { counts[t] = (counts[t] || 0) + 1; });
    const mine = uid ? react[uid] : undefined;

    const pick = async (k: ReactionKey) => {
        if (!dbRef.current) return;
        if (!uid) {
            try { await authRef.current.signInWithPopup(new (window as any).firebase.auth.GoogleAuthProvider()); } catch {}
            return;
        }
        const ref = dbRef.current.ref(`chapterReactions/${key}/${uid}`);
        try { if (mine === k) await ref.remove(); else await ref.set(k); }
        catch (e: any) { setMsg('Gagal menyimpan reaksi: ' + (e?.message || 'izin database ditolak')); setTimeout(() => setMsg(''), 3000); }
    };

    const share = async () => {
        const link = window.location.href;
        try {
            if (navigator.share) await navigator.share({ title: document.title, url: link });
            else { await navigator.clipboard.writeText(link); setMsg('Link disalin'); setTimeout(() => setMsg(''), 2000); }
        } catch {}
    };

    const label = chNum ? `Ch. ${chNum}` : 'chapter ini';
    return (
        <div id="akhir-chapter" style={{ background: '#1B1A20', padding: '26px 14px 220px', color: '#fff' }}>
            <div style={{ textAlign: 'center', fontSize: 25, fontWeight: 800, letterSpacing: -0.9, marginBottom: 14 }}>Gimana {label}?</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {REACTIONS.map((r) => {
                    const on = mine === r.key;
                    return (
                        <button key={r.key} onClick={() => pick(r.key)} style={{ background: '#2A2931', border: on ? '2px solid #FF6B6B' : '2px solid transparent', borderRadius: 18, padding: '14px 0 12px', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                            <KomoFace kind={r.key} size={44} />
                            <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.6, marginTop: 4 }}>{counts[r.key] || 0}</span>
                            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.4, color: '#8F8D9B', marginTop: -4 }}>{r.label}</span>
                        </button>
                    );
                })}
            </div>

            {nextLink && (
                <button onClick={onNext} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16, background: '#2A2931', border: 0, borderRadius: 18, padding: 0, marginTop: 16, overflow: 'hidden', textAlign: 'left', color: '#fff', cursor: 'pointer' }}>
                    {thumb
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={thumb} alt="" referrerPolicy="no-referrer" style={{ width: 66, height: 66, objectFit: 'cover', flex: '0 0 66px' }} />
                        : <span style={{ width: 66, height: 66, background: '#3A3940', flex: '0 0 66px' }} />}
                    <span style={{ flex: 1, padding: '10px 0' }}>
                        <span style={{ display: 'block', fontSize: 19, fontWeight: 800, letterSpacing: -0.5, color: '#8F8D9B' }}>CHAPTER BERIKUTNYA</span>
                        <span style={{ display: 'block', fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>{nextLabel || 'Lanjut baca'}</span>
                    </span>
                    <svg style={{ marginRight: 18 }} width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
                </button>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button onClick={() => router.push(komentarHref)} style={{ flex: 1, height: 58, borderRadius: 29, background: '#2A2931', border: 0, color: '#fff', fontSize: 23, fontWeight: 800, letterSpacing: -0.7, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer' }}>
                    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinejoin="round"><path d="M4 5h16v11H9l-5 4z" /></svg>
                    Komentar{commentCount !== null ? ` · ${commentCount}` : ''}
                </button>
                <button onClick={share} style={{ flex: 1, height: 58, borderRadius: 29, background: '#2A2931', border: 0, color: '#fff', fontSize: 23, fontWeight: 800, letterSpacing: -0.7, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer' }}>
                    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V4M8 8l4-4 4 4" /><path d="M5 12v7h14v-7" /></svg>
                    Bagikan
                </button>
            </div>
            {msg && <div style={{ textAlign: 'center', color: '#FF6B6B', fontSize: 15, fontWeight: 800, marginTop: 12 }}>{msg}</div>}
        </div>
    );
}
