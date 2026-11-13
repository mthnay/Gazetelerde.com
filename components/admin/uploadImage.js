// Görseli sunucuya yükler; { url, id, width, height } döner ya da hata fırlatır
export async function uploadImage(fileOrBlob, alt = '', filename = 'gorsel.webp') {
    const fd = new FormData();
    fd.append('file', fileOrBlob, fileOrBlob.name || filename);
    fd.append('alt', alt);
    const res = await fetch('/api/admin/media', { method: 'POST', body: fd }).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (!data?.success) throw new Error(data?.message || 'Görsel yüklenemedi.');
    return data.media;
}
