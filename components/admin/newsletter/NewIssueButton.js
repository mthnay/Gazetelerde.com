"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

export default function NewIssueButton() {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const create = async () => {
        setBusy(true);
        const res = await fetch('/api/admin/newsletters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => null);
        const data = await res?.json().catch(() => null);
        if (data?.id) router.push(`/admin/bulten/${data.id}`);
        else { setBusy(false); alert(data?.message || 'Bülten oluşturulamadı.'); }
    };
    return (
        <button type="button" className="admin-btn primary" onClick={create} disabled={busy}>
            {busy ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Plus size={15} />} Yeni bülten
        </button>
    );
}
