#!/bin/sh
set -e

echo "Veritabanı migration'ları uygulanıyor..."
node node_modules/prisma/build/index.js migrate deploy

echo "Sunucu başlatılıyor..."
node server.js &
PID=$!
trap 'kill -TERM $PID 2>/dev/null' TERM INT

# Isınma: build sırasında veritabanı yoksa önbellekli sayfalar boş üretilmiştir.
# Sağlık kontrolü geçince bu sayfaları iki kez çağırıp (ilki yenilemeyi tetikler)
# ilk gerçek ziyaretçiden önce veritabanından doldurulmalarını sağla.
for i in $(seq 1 30); do
  curl -fsS -o /dev/null "http://127.0.0.1:${PORT:-3000}/api/health" && break
  sleep 1
done
for round in 1 2; do
  for path in / /sitemap.xml /news-sitemap.xml /rss.xml; do
    curl -fsS -o /dev/null "http://127.0.0.1:${PORT:-3000}${path}" || true
  done
  sleep 2
done
echo "Hazır."

wait $PID
