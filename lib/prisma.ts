import { PrismaClient } from '@prisma/client'
// Force load env vars for Windows/Next issues
import * as dotenv from 'dotenv';
dotenv.config();

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_mQfMe2jhz4VK@ep-withered-glitter-aear9p56-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require",
        },
    },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
