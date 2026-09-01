import * as dotenv from "dotenv";
import * as path from "path";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

/**
 * Applies migrations to the test database.
 *
 * Tests truncate every table, so they run against `<db>_test` rather than the development
 * database. Run this after any `pnpm db:generate`, or the suite will fail on a missing
 * column with a confusing error.
 */
async function main() {
    dotenv.config({ path: path.resolve(__dirname, "../../.env") });

    const base = process.env.DATABASE_URL;
    if (!base) throw new Error("DATABASE_URL is not set.");

    const url = new URL(base);
    if (!url.pathname.endsWith("_test")) url.pathname = `${url.pathname}_test`;

    const pool = new Pool({ connectionString: url.toString() });
    const db = drizzle(pool);

    console.log(`Migrating test database ${url.pathname.slice(1)}...`);
    await migrate(db, { migrationsFolder: path.resolve(__dirname, "../../drizzle") });
    console.log("Test database migrated.");
    await pool.end();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
