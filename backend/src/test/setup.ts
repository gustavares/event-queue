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
 * database. Redirect to a sibling `<db>_test` unless TEST_DATABASE_URL says otherwise.
 * Create it once with:  pnpm test:db:setup
 */
if (!process.env.TEST_DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    if (!url.pathname.endsWith("_test")) {
        url.pathname = `${url.pathname}_test`;
    }
    process.env.TEST_DATABASE_URL = url.toString();
}
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

// The extractor must never reach the network during tests, even if a real key is
// present in .env. Suites that exercise extraction inject a fake explicitly.
delete process.env.ANTHROPIC_API_KEY;

jest.setTimeout(20000);
