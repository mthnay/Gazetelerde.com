# syntax=docker/dockerfile:1
# Gazetelerde — üretim imajı (Next.js standalone + Prisma)
#   docker build -t gazetelerde .
#   docker run -p 3000:3000 --env-file .env.production gazetelerde

ARG NODE_VERSION=22

# 1) Bağımlılıklar
FROM node:${NODE_VERSION}-bookworm-slim AS deps
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# 2) Build
FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_* değerleri build sırasında koda gömülür
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_IMAGE_HOSTS=images.unsplash.com
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL NEXT_PUBLIC_IMAGE_HOSTS=$NEXT_PUBLIC_IMAGE_HOSTS
# Build veritabanı gerektirmez: ulaşılamazsa sayfalar ilk istekte veritabanından doldurulur
RUN npm run build

# 3) Çalışma imajı (sadece gerekenler)
FROM node:${NODE_VERSION}-bookworm-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 app && useradd --system --uid 1001 --gid app app

COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
# Migration ve bakım betikleri için Prisma CLI + şema
COPY --from=build --chown=app:app /app/prisma ./prisma
COPY --from=build --chown=app:app /app/scripts ./scripts
COPY --from=build --chown=app:app /app/node_modules/prisma ./node_modules/prisma
COPY --from=build --chown=app:app /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build --chown=app:app /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=app:app docker-entrypoint.sh ./

USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS http://localhost:3000/api/health || exit 1

# Açılışta bekleyen migration'ları uygular, sonra sunucuyu başlatır
ENTRYPOINT ["./docker-entrypoint.sh"]
