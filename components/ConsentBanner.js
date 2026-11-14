"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { readConsent, saveConsent } from '@/lib/consentClient';

// KVKK / ePrivacy uyumlu çerez bandı: "Reddet" ve "Kabul et" eşit ağırlıkta; ayarlar her zaman alt bilgiden açılabilir.
// Yalnızca üçüncü taraf reklam kodları onaya bağlı; istatistik çerezsiz olduğu için sorulmaz.
export default function ConsentBanner({ adsEnabled }) {
    const [open, setOpen] = useState(false);
    const [details, setDetails] = useState(false);
    const [ads, setAds] = useState(false);

    useEffect(() => {
        if (!adsEnabled) return;
        const c = readConsent();
        // eslint-disable-next-line react-hooks/set-state-in-effect -- çerez yalnızca istemcide okunabilir
        if (!c) setOpen(true); else setAds(c.ads);
        const reopen = () => { setOpen(true); setDetails(true); setAds(readConsent()?.ads ?? false); };
        window.addEventListener('gz-consent-open', reopen);
        return () => window.removeEventListener('gz-consent-open', reopen);
    }, [adsEnabled]);

    if (!open) return null;
    const choose = (value) => { saveConsent({ ads: value }); setOpen(false); };

    return (
        <div className="consent" role="dialog" aria-modal="false" aria-labelledby="consent-title">
            <div className="consent-inner">
                <div>
                    <h2 id="consent-title" className="consent-title">Çerez tercihleriniz</h2>
                    <p>
                        Siteyi çalıştırmak için yalnızca zorunlu oturum çerezini kullanıyoruz; okunma istatistikleri çerezsizdir.
                        İzin verirseniz reklam ortaklarımız size uygun reklam göstermek için çerez kullanabilir. Ayrıntılar: <Link href="/gizlilik">Gizlilik ve çerez politikası</Link>.
                    </p>
                    {details && (
                        <div className="consent-options">
                            <label className="consent-row"><input type="checkbox" checked disabled /> <span><strong>Zorunlu</strong> — oturum ve güvenlik (kapatılamaz)</span></label>
                            <label className="consent-row"><input type="checkbox" checked={ads} onChange={(e) => setAds(e.target.checked)} /> <span><strong>Reklam</strong> — reklam ortaklarının çerezleri ve kişiselleştirilmiş reklam</span></label>
                        </div>
                    )}
                </div>
                <div className="consent-actions">
                    {details
                        ? <button type="button" className="btn btn-primary" onClick={() => choose(ads)}>Seçimimi kaydet</button>
                        : <button type="button" className="btn" onClick={() => setDetails(true)}>Ayarlar</button>}
                    <button type="button" className="btn" onClick={() => choose(false)}>Reddet</button>
                    <button type="button" className="btn btn-primary" onClick={() => choose(true)}>Kabul et</button>
                </div>
            </div>
        </div>
    );
}
