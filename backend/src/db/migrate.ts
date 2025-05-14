import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    console.log('Running migrations...');

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    const db = drizzle(pool);

    await migrate(db, { migrationsFolder: 'drizzle' });

    await pool.end();

    console.log('Migrations completed successfully');
}

main().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
