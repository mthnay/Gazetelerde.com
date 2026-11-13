// Sunucu açılınca bir kez çalışır. RSS kaynaklarını düzenli tarayan uygulama içi zamanlayıcıyı başlatır.
// Aralık: FEED_POLL_MINUTES (varsayılan 30). 0 yazılırsa kapanır.
export async function register() {
    if (process.env.NEXT_RUNTIME !== 'nodejs') return;
    if (process.env.NEXT_PHASE === 'phase-production-build') return;
    if (process.env.DATABASE_URL && !globalThis.__mailTimer) {
        // Bülten kuyruğu: dakikada bir zamanı gelen sayıları başlatır ve bir parti e-posta gönderir
        const { newsletterTick } = await import('./lib/newsletter/service.js');
        let busy = false;
        globalThis.__mailTimer = setInterval(async () => {
            if (busy) return;
            busy = true;
            try {
                const r = await newsletterTick();
                if (r?.sent || r?.failed) console.log(`[bülten] sayı ${r.issueId}: ${r.sent} gönderildi, ${r.failed} başarısız, ${r.pending} bekliyor.`);
            } catch (e) {
                console.error('[bülten] gönderim hatası:', e?.message);
            } finally {
                busy = false;
            }
        }, 60 * 1000);
    }
    const minutes = Number(process.env.FEED_POLL_MINUTES ?? 30);
    if (!minutes || minutes < 5 || !process.env.DATABASE_URL) return;
    if (globalThis.__feedTimer) return; // geliştirmede yeniden yüklemelerde iki kez kurulmasın

    const { pollAll } = await import('./lib/feeds.js');
    let running = false;
    const tick = async () => {
        if (running) return;
        running = true;
        try {
            const r = await pollAll();
            const added = r.reduce((n, x) => n + (x.added || 0), 0);
            if (added) console.log(`[akış] ${r.length} kaynak tarandı, ${added} yeni haber gelen kutusuna düştü.`);
        } catch (e) {
            console.error('[akış] tarama hatası:', e?.message);
        } finally {
            running = false;
        }
    };
    globalThis.__feedTimer = setInterval(tick, minutes * 60 * 1000);
    setTimeout(tick, 60 * 1000); // açılıştan 1 dk sonra ilk tarama
}
