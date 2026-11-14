// Yönetim paneli için küçük fetch yardımcısı
export async function api(url, method = 'GET', body) {
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).catch(() => null);
    return (await res?.json().catch(() => null)) || { success: false, message: 'Sunucuya ulaşılamadı.' };
}
