import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;

// 1. Create a connection pool using the 'pg' library
const pool = new pg.Pool({ connectionString });

// 2. Create the Prisma adapter
const adapter = new PrismaPg(pool);

// 3. Pass the adapter to the PrismaClient
const prisma = new PrismaClient({ adapter });

export default prisma;