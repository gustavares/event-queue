import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export type Database = NodePgDatabase<typeof schema>;

export const db: Database = drizzle(pool, { schema });

export async function testConnection() {
    try {
        await pool.query('SELECT NOW()');
        console.log('✅ Database connection successful');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
}
