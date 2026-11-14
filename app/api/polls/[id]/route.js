import { cookies } from 'next/headers';
import { ok, fail } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { pollView, voterHash } from '@/lib/polls';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
    const id = Number((await params).id);
    if (!Number.isInteger(id)) return fail('Anket bulunamadı.', 404);
    const user = await getCurrentUser();
    const anon = (await cookies()).get('gz_v')?.value;
    const view = await pollView(id, user || anon ? voterHash({ userId: user?.id, anonId: anon }) : null);
    return view ? ok({ poll: view }) : fail('Anket bulunamadı.', 404);
}
