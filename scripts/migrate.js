// Build öncesi: DATABASE_URL tanımlıysa bekleyen migration'ları uygular.
// Nova Cockpit gibi "npm run build" çalıştıran platformlarda şema her deploy'da kendiliğinden güncellenir.
// DATABASE_URL yoksa (ör. yerelde .env.local'siz build) sessizce atlar.
import { spawnSync } from 'node:child_process';

if (!process.env.DATABASE_URL) {
    console.log('[migrate] DATABASE_URL tanımlı değil, migration atlandı.');
    process.exit(0);
}
console.log('[migrate] Bekleyen migration\'lar uygulanıyor...');
const r = spawnSync('npx', ['prisma', 'migrate', 'deploy'], { stdio: 'inherit', env: process.env });
if (r.status !== 0) process.exit(r.status ?? 1);
// Veri düzeltmeleri (başarısız olursa deploy durmaz)
spawnSync('node', ['scripts/backfill-authors.mjs'], { stdio: 'inherit', env: process.env });
process.exit(0);
