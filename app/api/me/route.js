import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Tarayıcının "kim giriş yaptı" sorusu. Sayfalar bu bilgiyi sunucuda okumadığı için önbelleğe alınabilir.
export async function GET() {
    const user = await getCurrentUser();
    return NextResponse.json({ user }, { headers: { 'Cache-Control': 'private, no-store' } });
}
