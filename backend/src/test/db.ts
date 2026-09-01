import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../db/schema";

/**
 * A dedicated pool for tests.
 *
 * The app's `src/db` module opens its own pool at import time; using a separate one here
 * means a test file can close cleanly without tearing down the app's connection.
 */
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const testDb = drizzle(pool, { schema });
export type TestDb = typeof testDb;

/**
 * Empties every table. Call in `beforeEach` so tests never depend on each other's rows.
 *
 * Tables are discovered from the catalogue rather than hardcoded, so this keeps working as
 * the schema grows and cannot drift out of date. Drizzle's own migration bookkeeping is
 * left alone. `TRUNCATE ... CASCADE` in a single statement sidesteps foreign-key ordering.
 */
export async function resetDatabase(): Promise<void> {
    const { rows } = await pool.query<{ table_name: string }>(
        `SELECT table_name
         FROM information_schema.tables
         WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
    );

    if (rows.length === 0) return;

    const quoted = rows.map((r) => `"${r.table_name}"`).join(", ");
    await pool.query(`TRUNCATE ${quoted} RESTART IDENTITY CASCADE`);
}

export async function closeTestDb(): Promise<void> {
    await pool.end();
}
