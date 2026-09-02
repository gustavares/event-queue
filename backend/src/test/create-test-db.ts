import * as dotenv from "dotenv";
import * as path from "path";
import { Client } from "pg";

/**
 * Creates the `<db>_test` database if it does not exist.
 *
 * `setup.ts` referenced a `pnpm test:db:setup` script that was never written, so on a fresh
 * clone the suite failed against a database nobody had created — with a connection error
 * that did not say so.
 *
 *   pnpm test:db:create && pnpm test:db:migrate
 */
async function main() {
    dotenv.config({ path: path.resolve(__dirname, "../../.env") });

    const base = process.env.DATABASE_URL;
    if (!base) throw new Error("DATABASE_URL is not set.");

    const target = new URL(base);
    if (!target.pathname.endsWith("_test")) {
        target.pathname = `${target.pathname}_test`;
    }
    const dbName = target.pathname.slice(1);

    // Connect to the maintenance database — you cannot CREATE DATABASE from inside it.
    const admin = new URL(base);
    admin.pathname = "/postgres";

    const client = new Client({ connectionString: admin.toString() });
    await client.connect();

    const existing = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if (existing.rowCount && existing.rowCount > 0) {
        console.log(`Test database "${dbName}" already exists.`);
    } else {
        // The name is derived from DATABASE_URL, not user input, and CREATE DATABASE cannot
        // be parameterised — quote it rather than interpolating raw.
        await client.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
        console.log(`Created test database "${dbName}".`);
    }

    await client.end();
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
