"use client";
import { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';

const KEY = 'gz-pwa';
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const write = (v) => { try { localStorage.setItem(KEY, JSON.stringify({ ...read(), ...v })); } catch { /* yoksay */ } };

// Service worker'ı kaydeder ve uygun anda "uygulamayı yükle" önerir:
// sitede en az 3 sayfa gezilmişse, daha önce kapatılmamışsa; Android'de tek tıkla, iPhone'da adım adım.
export default function PwaInstall() {
    const [prompt, setPrompt] = useState(null);
    const [ios, setIos] = useState(false);
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') return;
        const register = () => navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
        if (document.readyState === 'complete') register(); else window.addEventListener('load', register, { once: true });

        const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
        if (standalone) return;
        const st = read();
        write({ views: (st.views || 0) + 1 });
        const dismissedRecently = st.dismissedAt && Date.now() - st.dismissedAt < 30 * 864e5;
        const engaged = (st.views || 0) + 1 >= 3;
        if (dismissedRecently || !engaged) return;

        const onPrompt = (e) => { e.preventDefault(); setPrompt(e); setShow(true); };
        window.addEventListener('beforeinstallprompt', onPrompt);
        const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && /safari/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- tarayıcı türü yalnızca istemcide bilinir
        if (isIos) { setIos(true); setShow(true); }
        return () => window.removeEventListener('beforeinstallprompt', onPrompt);
    }, []);

    if (!show) return null;
    const close = () => { write({ dismissedAt: Date.now() }); setShow(false); };
    const install = async () => {
        prompt.prompt();
        const { outcome } = await prompt.userChoice.catch(() => ({}));
        if (outcome === 'accepted') write({ installed: true });
        setShow(false);
    };

    return (
        <div className="pwa-card" role="dialog" aria-label="Uygulamayı yükle">
            <span className="pwa-icon" aria-hidden="true">G</span>
            <div style={{ flex: 1 }}>
                <strong>Gazetelerde cebinizde</strong>
                {ios
                    ? <p>Safari&apos;de <Share size={14} style={{ verticalAlign: -2 }} aria-label="Paylaş" /> düğmesine dokunup <b>Ana Ekrana Ekle</b>&apos;yi seçin. Son dakika bildirimleri iPhone&apos;da böyle çalışır.</p>
                    : <p>Ana ekranınıza ekleyin: daha hızlı açılır, internet yokken son okuduklarınız elinizde.</p>}
            </div>
            {!ios && prompt && <button type="button" className="btn btn-primary btn-sm" onClick={install}><Download size={15} /> Yükle</button>}
            <button type="button" className="pwa-close" onClick={close} aria-label="Kapat"><X size={16} /></button>
        </div>
    );
}
