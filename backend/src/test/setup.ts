import * as dotenv from "dotenv";
import * as path from "path";

// Tests run against the real development database. `.env` is loaded here rather than
// relying on the app's own load, so a test can never accidentally run with no
// DATABASE_URL and silently connect somewhere unexpected.
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

if (!process.env.DATABASE_URL) {
    throw new Error(
        "DATABASE_URL is not set. Tests need a running Postgres — see BOOTSTRAP.md."
    );
}

/**
 * Tests truncate every table between cases, so they must never point at the development
 * database. Redirect to a sibling `<db>_test`.
 *
 * Set up the test database once with:  pnpm test:db:create && pnpm test:db:migrate
 *
 * An explicit TEST_DATABASE_URL is honoured but still has to end in `_test`. Without that
 * guard, a stray value silently pointed the suite at a real database and the first
 * `resetDatabase()` would have truncated it — and `test:db:migrate` derives its own URL, so
 * the two could migrate one database and wipe another.
 */
function testDatabaseUrl(): string {
    const explicit = process.env.TEST_DATABASE_URL;
    if (explicit) {
        if (!new URL(explicit).pathname.endsWith("_test")) {
            throw new Error(
                `TEST_DATABASE_URL must name a database ending in "_test" — refusing to run a ` +
                    `suite that truncates every table against "${new URL(explicit).pathname.slice(1)}".`
            );
        }
        return explicit;
    }

    const url = new URL(process.env.DATABASE_URL as string);
    if (!url.pathname.endsWith("_test")) {
        url.pathname = `${url.pathname}_test`;
    }
    return url.toString();
}

process.env.TEST_DATABASE_URL = testDatabaseUrl();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

// The extractor must never reach the network during tests, even if a real key is
// present in .env. Suites that exercise extraction inject a fake explicitly.
delete process.env.ANTHROPIC_API_KEY;

jest.setTimeout(20000);
