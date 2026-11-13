import 'server-only';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

// Sayfa düzeyinde yetki kontrolü (layout sadece "personel mi" diye bakar)
export async function requirePageUser(check = () => true) {
    const user = await getCurrentUser();
    if (!user) redirect('/login?next=/admin');
    if (!check(user)) redirect('/admin');
    return user;
}
