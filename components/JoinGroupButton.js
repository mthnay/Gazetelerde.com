"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Copy, LogIn, LogOut } from 'lucide-react';
import { useSession } from '@/components/SessionProvider';

// Grup sayfası: davet bağlantısını paylaş, katıl / ayrıl
export default function JoinGroupButton({ groupId, code, memberIds }) {
    const { user, loading } = useSession();
    const router = useRouter();
    const [msg, setMsg] = useState('');
    const [url, setUrl] = useState('');
    useEffect(() => { setUrl(`${location.origin}/tahmin-ligi/grup/${code}`); }, [code]); // eslint-disable-line react-hooks/set-state-in-effect -- adres yalnızca istemcide bilinir
    if (loading) return null;
    const member = user && memberIds.includes(user.id);
    const call = async (method, body) => {
        const d = await fetch('/api/tahmin-ligi/gruplar', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json()).catch(() => null);
        if (!d?.success) return setMsg(d?.message || 'İşlem başarısız.');
        if (method === 'DELETE') router.push('/tahmin-ligi'); else router.refresh();
    };
    const share = async () => {
        try { if (navigator.share) await navigator.share({ title: 'Tahmin ligime katıl', text: `Gazetelerde Tahmin Ligi'nde arkadaş ligime katıl! Davet kodu: ${code}`, url }); else { await navigator.clipboard.writeText(url); setMsg('Davet bağlantısı kopyalandı.'); } } catch { /* vazgeçildi */ }
    };
    return (
        <div className="fl-actions">
            {!user ? <Link className="btn btn-primary" href={`/login?next=/tahmin-ligi/grup/${code}`}><LogIn size={16} /> Katılmak için giriş yapın</Link>
                : member ? <>
                    <button type="button" className="btn btn-primary" onClick={share}><Copy size={16} /> Arkadaşlarını davet et</button>
                    <button type="button" className="btn" onClick={() => confirm('Bu ligden ayrılmak istiyor musunuz? (Kurucuysanız lig silinir.)') && call('DELETE', { groupId })}><LogOut size={16} /> Ayrıl</button>
                </> : <button type="button" className="btn btn-primary" onClick={() => call('POST', { code })}><LogIn size={16} /> Lige katıl</button>}
            <span className="fl-code">Davet kodu: <b>{code}</b></span>
            {msg && <span className="field-hint" role="status">{msg}</span>}
        </div>
    );
}
