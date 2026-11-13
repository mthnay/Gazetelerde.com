import { redirect } from 'next/navigation';
import { getCurrentUser, isStaff } from '@/lib/auth';

export const metadata = { title: 'Yönetim Paneli | Gazetelerde', robots: { index: false } };

export default async function AdminLayout({ children }) {
    const user = await getCurrentUser();
    if (!user) redirect('/login?next=/admin');
    if (!isStaff(user)) redirect('/');
    return children;
}
