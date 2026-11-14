// Yapay zekâ editör yardımcısı (Claude). ANTHROPIC_API_KEY tanımlı değilse kapalıdır.
// Her görev, yapılandırılmış sonucu tek bir "sonuc" aracıyla (strict şema) döndürür.
import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';
import { plainText } from '@/lib/html';

export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);
const MODEL = 'claude-opus-5-5';
let client;
const getClient = () => (client ??= new Anthropic());

// Sabit sistem talimatı (önbelleğe alınabilir; değişken içerik kullanıcı mesajında)
const SYSTEM = `Sen Türkçe yayın yapan bir haber sitesinin (Gazetelerde) kıdemli editörüsün.
İlkeler:
- Yalnızca sana verilen metindeki bilgileri kullan. Metinde olmayan isim, sayı, tarih, alıntı ya da olay ekleme; emin olmadığın bir şeyi yazma.
- Türkiye Türkçesi yazım kurallarına (TDK) uy; kısa, açık, haber diliyle yaz. Tık tuzağı, abartı ve büyük harfle bağırma yok.
- Başlıklar 50-80 karakter arası, öznesi ve yüklemi belli, olayın kendisini anlatan cümleler olsun.
- Sonucu her zaman "sonuc" aracını çağırarak ver; araç dışında açıklama yazma.`;

const str = (description, extra = {}) => ({ type: 'string', description, ...extra });
const arr = (items, description) => ({ type: 'array', items, description });
const obj = (properties) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });

// Görevler: istem + sonuç şeması + düşünme derinliği
const TASKS = {
    basliklar: {
        effort: 'low',
        prompt: (i) => `Aşağıdaki haber için 5 farklı başlık önerisi, arama motoru için 60 karakteri geçmeyen bir SEO başlığı ve 150-160 karakterlik bir meta açıklama yaz.\n\n${i.text}`,
        schema: obj({ titles: arr(str('Başlık önerisi'), '5 başlık'), seoTitle: str('SEO başlığı'), metaDescription: str('Meta açıklama') }),
    },
    ozet: {
        effort: 'low',
        prompt: (i) => `Aşağıdaki haberin girişine konacak, 1-2 cümlelik, 200-300 karakter arası bir özet (spot) yaz. Haberin en önemli bilgisini öne al.\n\n${i.text}`,
        schema: obj({ summary: str('Özet') }),
    },
    etiket: {
        effort: 'low',
        prompt: (i) => `Aşağıdaki haber için uygun kategoriyi şu listeden seç: ${i.categories.join(', ')}.\nAyrıca 3-7 etiket öner: kişi, kurum, takım, yer ve konu adları; her biri 1-3 kelime. Mümkünse şu mevcut etiketlerden kullan: ${i.knownTags.join(', ') || '(yok)'}.\n\n${i.text}`,
        schema: obj({ category: str('Kategori (listeden biri)'), tags: arr(str('Etiket'), 'Etiketler') }),
    },
    yazim: {
        effort: 'medium',
        prompt: (i) => `Aşağıdaki haber metnindeki yazım, noktalama ve dil bilgisi hatalarını bul. Her hata için metindeki birebir yanlış ifadeyi (aynen kopyala, en az 2 kelime ki metinde tek olsun), düzeltilmiş halini ve kısa gerekçesini ver. Üslup tercihlerini değil yalnızca gerçek hataları bildir. Hata yoksa boş liste döndür.\n\n${i.text}`,
        schema: obj({ issues: arr(obj({ original: str('Metindeki birebir ifade'), suggestion: str('Düzeltilmiş hali'), reason: str('Kısa gerekçe') }), 'Hatalar') }),
    },
    taslak: {
        effort: 'medium',
        prompt: (i) => `Aşağıda başka bir kaynaktan alınmış bir haber var${i.sourceUrl ? ` (kaynak: ${i.sourceUrl})` : ''}. Bunu Gazetelerde için özgün bir haber taslağına dönüştür:
- Cümleleri kopyalama; bilgileri kendi cümlelerinle, haber piramidine göre (en önemli bilgi başta) yeniden yaz.
- Kaynakta olmayan hiçbir bilgi ekleme. Doğrudan alıntıları tırnak içinde ve sahibine atfederek koru.
- 4-8 paragraf; başlık ve 1-2 cümlelik özet de yaz.

${i.text}`,
        schema: obj({ title: str('Başlık'), summary: str('Özet'), paragraphs: arr(str('Paragraf'), 'Paragraflar') }),
    },
    'mac-ozeti': {
        effort: 'medium',
        prompt: (i) => `Aşağıda bir maçın canlı anlatım notları (eskiden yeniye) ve skor bilgisi var. Bunlardan maç sonu haberi yaz: başlık, 1-2 cümlelik özet ve 3-6 paragraf. Yalnızca notlarda geçen bilgileri kullan.\n\n${i.text}`,
        schema: obj({ title: str('Başlık'), summary: str('Özet'), paragraphs: arr(str('Paragraf'), 'Paragraflar') }),
    },
};
export const AI_TASKS = Object.keys(TASKS);

export class AiError extends Error {}

export async function runAi(task, input, userId) {
    const t = TASKS[task];
    if (!t) throw new AiError('Bilinmeyen görev.');
    if (!aiEnabled()) throw new AiError('Yapay zekâ yardımcısı kapalı: sunucuda ANTHROPIC_API_KEY tanımlı değil.');

    let response;
    try {
        response = await getClient().beta.messages.create({
            model: MODEL,
            max_tokens: 16000,
            // Güvenlik sınıflandırıcısı bir isteği reddederse sunucu tarafında uygun modele düşer
            betas: ['server-side-fallback-2026-07-01'],
            fallbacks: 'default',
            output_config: { effort: t.effort },
            system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
            tools: [{ name: 'sonuc', description: 'Görevin sonucunu bu araçla ver.', strict: true, input_schema: t.schema }],
            tool_choice: { type: 'auto' },
            messages: [{ role: 'user', content: `${t.prompt(input)}\n\nSonucu "sonuc" aracıyla ver.` }],
        });
    } catch (e) {
        if (e instanceof Anthropic.RateLimitError) throw new AiError('Yapay zekâ servisi şu an yoğun, biraz sonra tekrar deneyin.');
        if (e instanceof Anthropic.AuthenticationError) throw new AiError('Yapay zekâ API anahtarı geçersiz.');
        if (e instanceof Anthropic.BadRequestError) throw new AiError(`İstek reddedildi: ${e.message.slice(0, 200)}`);
        if (e instanceof Anthropic.APIError) throw new AiError('Yapay zekâ servisine ulaşılamadı, tekrar deneyin.');
        throw e;
    }

    await prisma.aiUsage.create({ data: { userId, task, inputTok: response.usage.input_tokens ?? 0, outputTok: response.usage.output_tokens ?? 0 } }).catch(() => {});

    if (response.stop_reason === 'refusal') throw new AiError('Bu içerik için öneri üretilemedi (güvenlik filtresi). Metni gözden geçirip tekrar deneyin.');
    if (response.stop_reason === 'max_tokens') throw new AiError('Metin çok uzun olduğu için sonuç yarım kaldı; daha kısa bir bölümle deneyin.');
    const call = response.content.find((b) => b.type === 'tool_use' && b.name === 'sonuc');
    if (!call || typeof call.input !== 'object') throw new AiError('Yapay zekâ beklenen biçimde yanıt vermedi, tekrar deneyin.');
    return call.input;
}

// Stüdyodaki haberi düz metne çevir (çok uzunsa kullanıcıya söyleriz; sessizce kırpmayız)
export const MAX_CHARS = 60000;
export function articleText({ title = '', summary = '', content = '' }) {
    return [title && `Başlık: ${title}`, summary && `Özet: ${summary}`, `Metin:\n${plainText(content)}`].filter(Boolean).join('\n\n');
}
