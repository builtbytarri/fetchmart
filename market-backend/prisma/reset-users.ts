/**
 * Dev-only utility — wipes ALL users and any data tied to them.
 * Run with: npx tsx prisma/reset-users.ts
 *
 * DO NOT run this against production.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to wipe users in production');
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in your .env');
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('Wiping users and all dependent rows…');
    // CASCADE follows FKs — clears oauth_accounts, refresh_tokens, password_reset_tokens,
    // stores (+ products, categories), riders, orders (+ order_items).
    await prisma.$executeRawUnsafe('TRUNCATE TABLE users CASCADE');
    console.log('Done.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
