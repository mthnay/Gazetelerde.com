import 'server-only';
import nodemailer from 'nodemailer';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// E-posta gönderici.
//  SMTP_URL  : smtp(s)://kullanici:sifre@sunucu:port  (Resend, Amazon SES, Brevo, Mailgun, kendi sunucunuz…)
//  MAIL_FROM : "Gazetelerde <bulten@alanadiniz.com>"
// Geliştirmede SMTP_URL yoksa e-postalar gönderilmez, .mail-outbox klasörüne HTML olarak yazılır.

const OUTBOX = path.join(process.cwd(), '.mail-outbox');
let transport = null;

export const mailFrom = () => process.env.MAIL_FROM || 'Gazetelerde <bulten@localhost>';
export const isMailConfigured = () => Boolean(process.env.SMTP_URL) || process.env.NODE_ENV !== 'production';
export const mailMode = () => (process.env.SMTP_URL ? 'smtp' : process.env.NODE_ENV !== 'production' ? 'outbox' : 'off');

function getTransport() {
    if (transport) return transport;
    if (process.env.SMTP_URL) {
        transport = nodemailer.createTransport(process.env.SMTP_URL, { pool: true, maxConnections: 2, maxMessages: 200 });
    }
    return transport;
}

export async function sendMail({ to, subject, html, text, headers = {} }) {
    const mode = mailMode();
    if (mode === 'off') throw new Error('E-posta gönderimi yapılandırılmadı (SMTP_URL tanımlı değil).');
    if (mode === 'outbox') {
        await mkdir(OUTBOX, { recursive: true });
        const name = `${new Date().toISOString().replace(/[:.]/g, '-')}-${String(to).replace(/[^a-z0-9@._-]/gi, '_')}.html`;
        const meta = `<!--\nKime: ${to}\nKonu: ${subject}\n${Object.entries(headers).map(([k, v]) => `${k}: ${v}`).join('\n')}\n-->\n`;
        await writeFile(path.join(OUTBOX, name), meta + html);
        return { messageId: `outbox:${name}` };
    }
    return getTransport().sendMail({ from: mailFrom(), to, subject, html, text, headers });
}

// Bağlantı ve kimlik bilgilerini doğrular (panelde "Bağlantıyı test et")
export async function verifyMail() {
    const mode = mailMode();
    if (mode !== 'smtp') return { ok: mode === 'outbox', mode };
    try {
        await getTransport().verify();
        return { ok: true, mode };
    } catch (e) {
        return { ok: false, mode, error: String(e?.message || e).slice(0, 300) };
    }
}
