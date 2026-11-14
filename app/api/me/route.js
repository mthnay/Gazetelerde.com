import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getSupport } from '@/lib/supporters';

// Tarayıcının "kim giriş yaptı" sorusu. Sayfalar bu bilgiyi sunucuda okumadığı için önbelleğe alınabilir.
// Destekçiler için reklamsız okuma bilgisi de döner.
export async function GET() {
    const user = await getCurrentUser();
    const support = user ? await getSupport(user.id) : null;
    return NextResponse.json(
        { user: user ? { ...user, supporter: Boolean(support), adFree: Boolean(support) } : null },
        { headers: { 'Cache-Control': 'private, no-store' } },
    );
}
