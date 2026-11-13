import { PrismaClient } from '@prisma/client';

// Geliştirmede hot-reload her seferinde yeni bağlantı havuzu açmasın
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.__prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.__prisma = prisma;
