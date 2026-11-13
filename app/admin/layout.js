import { redirect } from 'next/navigation';
import { getCurrentUser, isStaff } from '@/lib/auth';
import AdminShell from '@/components/admin/AdminShell';
import './admin.css';

export const metadata = { title: 'Yönetim Paneli | Gazetelerde', robots: { index: false } };

export default async function AdminLayout({ children }) {
    const user = await getCurrentUser();
    if (!user) redirect('/login?next=/admin');
    if (!isStaff(user)) redirect('/');
    return <AdminShell user={user}>{children}</AdminShell>;
}
