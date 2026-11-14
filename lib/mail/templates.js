// E-posta şablonları. E-posta istemcileri (özellikle Outlook) modern CSS'i desteklemediği için
// tablo tabanlı ve satır içi stilli HTML üretilir.
import { absoluteUrl, SITE_NAME } from '@/lib/site';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const INK = '#16130f', PAPER = '#f4efe6', BRAND = '#ffc21a', MUTED = '#6b635a', LINE = '#e3dccf';
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

// Görseller e-postada JPEG olarak (Outlook WebP göstermez) ve 600 px'e küçültülmüş sunulur
export function emailImage(src, width = 600) {
    if (!src) return null;
    if (src.startsWith('/media/')) return absoluteUrl(`${src}?w=${width}&f=jpg`);
    return src.startsWith('https://') ? src : null;
}

function layout({ preheader = '', body, footer }) {
    return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(SITE_NAME)}</title></head>
<body style="margin:0;padding:0;background:${PAPER};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#fffcf6;border:1px solid ${LINE};border-radius:14px;overflow:hidden;">
<tr><td style="padding:22px 28px;border-bottom:3px solid ${INK};">
  <a href="${absoluteUrl('/')}" style="text-decoration:none;color:${INK};font-family:${SERIF};font-size:28px;font-weight:bold;letter-spacing:-0.5px;">Gazetelerde<span style="color:${BRAND};">.</span></a>
</td></tr>
${body}
<tr><td style="padding:22px 28px;background:${INK};color:#cfc7bb;font-family:${SANS};font-size:12px;line-height:1.6;">${footer}</td></tr>
</table></td></tr></table></body></html>`;
}

const button = (href, label) => `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:${BRAND};border-radius:99px;">
<a href="${esc(href)}" style="display:inline-block;padding:13px 26px;font-family:${SANS};font-size:15px;font-weight:bold;color:${INK};text-decoration:none;">${esc(label)}</a></td></tr></table>`;

// ---------------------------------------------------------------- Abonelik onayı
export function confirmEmail({ confirmUrl }) {
    const body = `<tr><td style="padding:32px 28px;font-family:${SANS};color:${INK};">
<h1 style="margin:0 0 12px;font-family:${SERIF};font-size:26px;line-height:1.2;">Aboneliğinizi onaylayın</h1>
<p style="margin:0 0 22px;font-size:16px;line-height:1.6;color:#3b352e;">Gazetelerde sabah bültenine abone olmak için bu adres kullanıldı. Aboneliği başlatmak için aşağıdaki düğmeye tıklayın.</p>
${button(confirmUrl, 'Aboneliği onayla')}
<p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:${MUTED};">Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz; onaylamadığınız sürece size bülten gönderilmez.</p>
</td></tr>`;
    return {
        subject: 'Gazetelerde bülten aboneliğinizi onaylayın',
        html: layout({ preheader: 'Tek tıkla aboneliğinizi başlatın.', body, footer: `${esc(SITE_NAME)} · Bu e-posta bir abonelik isteği üzerine gönderildi.` }),
        text: `Gazetelerde bülten aboneliğinizi onaylamak için: ${confirmUrl}\n\nBu isteği siz yapmadıysanız bu e-postayı yok sayın.`,
    };
}

// ---------------------------------------------------------------- Bülten
export function newsletterEmail({ issue, articles, unsubscribeUrl, viewUrl }) {
    const date = new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' }).format(issue.sentAt || issue.scheduledAt || new Date());
    const [lead, ...rest] = articles;
    const url = (a) => absoluteUrl(`/haber/${a.slug}?utm_source=bulten&utm_medium=email&utm_campaign=bulten-${issue.id}`);

    const leadHtml = lead ? `<tr><td style="padding:0 28px 8px;">
${emailImage(lead.image) ? `<a href="${url(lead)}"><img src="${esc(emailImage(lead.image))}" width="544" alt="${esc(lead.title)}" style="display:block;width:100%;max-width:544px;height:auto;border-radius:10px;border:0;"></a>` : ''}
<p style="margin:16px 0 6px;font-family:${SANS};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${MUTED};">${esc(lead.category)}</p>
<a href="${url(lead)}" style="text-decoration:none;color:${INK};"><h2 style="margin:0 0 8px;font-family:${SERIF};font-size:26px;line-height:1.2;">${esc(lead.title)}</h2></a>
<p style="margin:0 0 6px;font-family:${SANS};font-size:15px;line-height:1.6;color:#3b352e;">${esc(lead.summary)}</p>
</td></tr>` : '';

    const restHtml = rest.map((a) => `<tr><td style="padding:16px 28px;border-top:1px solid ${LINE};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
${emailImage(a.image, 240) ? `<td width="120" valign="top" style="padding-right:16px;"><a href="${url(a)}"><img src="${esc(emailImage(a.image, 240))}" width="120" alt="" style="display:block;width:120px;height:auto;border-radius:8px;border:0;"></a></td>` : ''}
<td valign="top" style="font-family:${SANS};">
<p style="margin:0 0 4px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${MUTED};">${esc(a.category)}</p>
<a href="${url(a)}" style="text-decoration:none;color:${INK};"><span style="font-family:${SERIF};font-size:18px;font-weight:bold;line-height:1.3;">${esc(a.title)}</span></a>
<p style="margin:6px 0 0;font-size:14px;line-height:1.55;color:#3b352e;">${esc(a.summary)}</p>
</td></tr></table></td></tr>`).join('');

    const body = `<tr><td style="padding:26px 28px 18px;font-family:${SANS};">
<p style="margin:0 0 8px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${MUTED};">${esc(date)}</p>
<h1 style="margin:0 0 10px;font-family:${SERIF};font-size:24px;line-height:1.25;color:${INK};">${esc(issue.subject)}</h1>
${issue.intro ? `<p style="margin:0;font-size:15px;line-height:1.65;color:#3b352e;">${esc(issue.intro).replace(/\n/g, '<br>')}</p>` : ''}
</td></tr>
${leadHtml}
${restHtml}
<tr><td align="center" style="padding:26px 28px 30px;border-top:1px solid ${LINE};">${button(absoluteUrl('/?utm_source=bulten&utm_medium=email'), 'Tüm haberler için siteye gidin')}</td></tr>`;

    const footer = `Bu e-postayı Gazetelerde bültenine abone olduğunuz için alıyorsunuz.<br>
${viewUrl ? `<a href="${esc(viewUrl)}" style="color:${BRAND};">Tarayıcıda görüntüle</a> · ` : ''}<a href="${esc(unsubscribeUrl)}" style="color:${BRAND};">Abonelikten çık</a>`;

    const text = [
        issue.subject, date, '', issue.intro, '',
        ...articles.map((a) => `• ${a.title}\n  ${a.summary}\n  ${url(a)}`), '',
        `Abonelikten çıkmak için: ${unsubscribeUrl}`,
    ].join('\n');

    return { subject: issue.subject, html: layout({ preheader: issue.preheader || articles[0]?.title || '', body, footer }), text };
}
