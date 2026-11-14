// Destek paketi doğrulaması
export function parseTier(b) {
    const name = String(b.name || '').trim().slice(0, 60);
    const amount = Math.round(Number(b.amount));
    if (!name) return { error: 'Paket adı gerekli.' };
    if (!Number.isFinite(amount) || amount < 1 || amount > 100000) return { error: 'Geçerli bir tutar girin (TL).' };
    if (!/^https:\/\/\S+$/i.test(String(b.paymentUrl || ''))) return { error: 'Ödeme bağlantısı https:// ile başlamalı.' };
    return {
        data: {
            name, amount, description: String(b.description || '').slice(0, 300),
            period: ['tek', 'aylik', 'yillik'].includes(b.period) ? b.period : 'aylik',
            paymentUrl: String(b.paymentUrl).slice(0, 500), adFree: b.adFree !== false,
            sortOrder: Number(b.sortOrder) || 0, active: b.active !== false,
        },
    };
}

