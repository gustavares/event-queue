import { testDb, resetDatabase, closeTestDb } from "./db";
import { user } from "../db/schema";

/**
 * Proves the harness itself works: it connects, writes, reads, and resets between tests.
 * Feature suites build on this; if this fails, nothing else is trustworthy.
 */
describe("test harness", () => {
    beforeEach(async () => {
        await resetDatabase();
    });

    afterAll(async () => {
        await closeTestDb();
    });

    it("connects to the database", async () => {
        const rows = await testDb.select().from(user);
        expect(Array.isArray(rows)).toBe(true);
    });

    it("writes and reads back", async () => {
        await testDb.insert(user).values({
            email: "harness@test.dev",
            name: "Harness",
            password: "not-a-real-hash",
        });

        const rows = await testDb.select().from(user);
        expect(rows).toHaveLength(1);
        expect(rows[0].email).toBe("harness@test.dev");
    });

    it("resets between tests", async () => {
        const rows = await testDb.select().from(user);
        expect(rows).toHaveLength(0);
    });
});
