"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Edit3, Trash2, ExternalLink } from 'lucide-react';

export default function ArticleRowActions({ article, canEdit }) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);

    const remove = async () => {
        if (!confirm(`"${article.title}" kalıcı olarak silinsin mi? Yorumları ve beğenileri de silinir. Bu işlem geri alınamaz.\n\nYayından kaldırmak istiyorsanız arşive almayı tercih edin.`)) return;
        setBusy(true);
        const res = await fetch(`/api/admin/articles/${article.id}`, { method: 'DELETE' }).catch(() => null);
        const data = await res?.json().catch(() => null);
        setBusy(false);
        if (!data?.success) return alert(data?.message || 'Silinemedi.');
        router.refresh();
    };

    return (
        <div className="admin-actions">
            {article.status === 'PUBLISHED' && (
                <Link href={`/haber/${article.slug}`} target="_blank" className="admin-icon-btn" title="Sitede gör" aria-label="Sitede gör">
                    <ExternalLink size={15} />
                </Link>
            )}
            {canEdit && (
                <>
                    <Link href={`/admin/haberler/${article.id}`} className="admin-icon-btn" title="Düzenle" aria-label="Düzenle">
                        <Edit3 size={15} />
                    </Link>
                    <button onClick={remove} disabled={busy} className="admin-icon-btn danger" title="Sil" aria-label="Sil">
                        <Trash2 size={15} />
                    </button>
                </>
            )}
        </div>
    );
}
