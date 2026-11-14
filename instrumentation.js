// Sunucu açılınca bir kez çalışır: arka plan işlerini (RSS tarama, bülten ve bildirim kuyruğu) başlatır
// ve sunucu hatalarını hata takibine kaydeder (/admin/sistem).
//   FEED_POLL_MINUTES (varsayılan 30, 0 = kapalı)

// Her iş için son çalışma bilgisi; sistem sayfası buradan okur
const jobs = (globalThis.__jobs ??= {});

function every(name, ms, fn, firstDelay = ms) {
    let busy = false;
    const run = async () => {
        if (busy) return;
        busy = true;
        const started = Date.now();
        try {
            const result = await fn();
            jobs[name] = { at: new Date().toISOString(), ok: true, ms: Date.now() - started, result: result ?? null };
        } catch (e) {
            jobs[name] = { at: new Date().toISOString(), ok: false, ms: Date.now() - started, error: e?.message };
            console.error(`[${name}] hata:`, e?.message);
            const { captureError } = await import('./lib/errors.js');
            await captureError({ source: 'is', error: e, path: name });
        } finally {
            busy = false;
        }
    };
    setTimeout(run, firstDelay);
    return setInterval(run, ms);
}

export async function register() {
    if (process.env.NEXT_RUNTIME !== 'nodejs') return;
    if (process.env.NEXT_PHASE === 'phase-production-build') return;
    if (!process.env.DATABASE_URL || globalThis.__jobsStarted) return; // geliştirmede yeniden yüklemelerde iki kez kurulmasın
    globalThis.__jobsStarted = true;

    const minutes = Number(process.env.FEED_POLL_MINUTES ?? 30);
    if (minutes >= 5) {
        const { pollAll } = await import('./lib/feeds.js');
        every('rss', minutes * 60 * 1000, async () => {
            const r = await pollAll();
            const added = r.reduce((n, x) => n + (x.added || 0), 0);
            if (added) console.log(`[akış] ${r.length} kaynak tarandı, ${added} yeni haber gelen kutusuna düştü.`);
            return { sources: r.length, added };
        }, 60 * 1000);
    }

    // Son dakika bildirimleri: dakikada bir kuyruğa bakılır
    const { sendPendingPushes, queueMatchReminders } = await import('./lib/push.js');
    every('bildirim', 60 * 1000, async () => {
        await queueMatchReminders(); // maçtan 1 saat önce takipçilere hatırlatma
        const p = await sendPendingPushes();
        if (p) console.log(`[bildirim] ${p.sent} gönderildi, ${p.failed} başarısız.`);
        return p;
    });

    // Bülten: zamanı gelen sayıları başlatır ve dakikada bir parti e-posta gönderir
    const { newsletterTick } = await import('./lib/newsletter/service.js');
    const { maybeCreateWeeklyVolley } = await import('./lib/newsletter/weeklyVolley.js');
    every('bulten', 60 * 1000, async () => {
        await maybeCreateWeeklyVolley(); // pazartesi 08:00 voleybol özeti taslağı
        const r = await newsletterTick();
        if (r?.sent || r?.failed) console.log(`[bülten] sayı ${r.issueId}: ${r.sent} gönderildi, ${r.failed} başarısız, ${r.pending} bekliyor.`);
        return r;
    });

    // Eski istatistik / çözülmüş hata kayıtlarını temizle (günde bir)
    every('temizlik', 24 * 60 * 60 * 1000, async () => {
        const { prisma } = await import('./lib/db.js');
        const errs = await prisma.errorEvent.deleteMany({ where: { resolved: true, lastSeen: { lt: new Date(Date.now() - 30 * 86400000) } } });
        const logins = await prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 30 * 86400000) } } });
        const notes = await prisma.userNotification.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 90 * 86400000) } } });
        // Hız ölçümlerinin 13 ayı aşanları silinir
        await prisma.vitalDaily.deleteMany({ where: { day: { lt: new Date(Date.now() - 400 * 86400000) } } });
        return { errors: errs.count, logins: logins.count, notifications: notes.count };
    }, 5 * 60 * 1000);
}

// Next.js: render / route / server action sırasında yakalanmayan her hata buraya gelir
export async function onRequestError(error, request, context) {
    if (process.env.NEXT_RUNTIME !== 'nodejs' || !process.env.DATABASE_URL) return;
    // "Bulunamadı" ve yönlendirmeler hata değildir
    if (error?.digest?.startsWith?.('NEXT_') || /NEXT_(NOT_FOUND|REDIRECT|HTTP_ERROR)/.test(error?.message || '')) return;
    const { captureError } = await import('./lib/errors.js');
    await captureError({ source: 'sunucu', error, path: `${request?.method || ''} ${request?.path || ''} (${context?.routeType || ''})`.trim() });
}
