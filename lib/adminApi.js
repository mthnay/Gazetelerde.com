import 'server-only';
import { getCurrentUser, isStaff } from '@/lib/auth';
import { fail } from '@/lib/api';

// Yetkisizse hazır hata yanıtı, yetkiliyse kullanıcıyı döndürür
export async function requireStaff(check = isStaff) {
    const user = await getCurrentUser();
    if (!user) return { error: fail('Giriş yapmalısınız.', 401) };
    if (!isStaff(user) || !check(user)) return { error: fail('Bu işlem için yetkiniz yok.', 403) };
    return { user };
}

export async function idParam(params) {
    const { id } = await params;
    const n = Number(id);
    return Number.isInteger(n) && n > 0 ? n : null;
}
