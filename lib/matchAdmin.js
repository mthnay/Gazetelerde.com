import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';

// Maç verisi değişince herkese açık sayfaları tazele
export async function revalidateLeague(leagueId) {
    const l = await prisma.league.findUnique({ where: { id: leagueId }, select: { slug: true } });
    revalidatePath('/mac-merkezi');
    revalidatePath('/');
    if (l) revalidatePath(`/mac-merkezi/${l.slug}`);
}
