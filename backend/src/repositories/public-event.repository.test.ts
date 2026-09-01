import { testDb, resetDatabase, closeTestDb } from "../test/db";
import DrizzlePostgresPublicEventRepository from "./public-event.repository";
import DrizzlePostgresArtistRepository from "./artist.repository";
import { user, city, venue, event, eventTeamMember, doorSaleTier } from "../db/schema";

/**
 * The public surface must fail closed.
 *
 * BR-DISC-003/005/009 and EDGE-1/3 are all "the query quietly returns something it
 * shouldn't" failures — invisible in a code review, obvious in a test.
 */
describe("PublicEventRepository", () => {
    const repo = new DrizzlePostgresPublicEventRepository(testDb as never);

    let userId: string;
    let cityId: string;
    let venueId: string;

    beforeEach(async () => {
        await resetDatabase();

        [{ id: userId }] = await testDb
            .insert(user)
            .values({ email: "owner@test.dev", name: "Owner", password: "x" })
            .returning({ id: user.id });

        [{ id: cityId }] = await testDb
            .insert(city)
            .values({ name: "São Paulo", state: "SP", slug: "sao-paulo" })
            .returning({ id: city.id });

        [{ id: venueId }] = await testDb
            .insert(venue)
            .values({ name: "Club Rooftop", address: "Rua Augusta 1500", cityId, createdBy: userId })
            .returning({ id: venue.id });
    });

    afterAll(async () => {
        await closeTestDb();
    });

    const inDays = (n: number) => new Date(Date.now() + n * 864e5);

    async function makeEvent(overrides: Record<string, unknown> = {}) {
        const [row] = await testDb
            .insert(event)
            .values({
                name: "Noite Carioca",
                startDate: inDays(7),
                endDate: inDays(7.25),
                status: "ACTIVE",
                venueId,
                createdBy: userId,
                visibility: "PUBLIC",
                slug: `noite-${Math.random().toString(36).slice(2, 10)}`,
                ...overrides,
            } as never)
            .returning({ id: event.id, slug: event.slug });
        return row;
    }

    describe("visibility", () => {
        it("returns a published event", async () => {
            await makeEvent();
            const found = await repo.findMany({ citySlug: "sao-paulo" });
            expect(found).toHaveLength(1);
            expect(found[0].name).toBe("Noite Carioca");
        });

        it("never returns an UNLISTED event in a listing", async () => {
            await makeEvent({ visibility: "UNLISTED" });
            expect(await repo.findMany({ citySlug: "sao-paulo" })).toHaveLength(0);
        });

        it("never returns an UNLISTED event by slug", async () => {
            const row = await makeEvent({ visibility: "UNLISTED", slug: "particular" });
            expect(await repo.findBySlug(row.slug!)).toBeNull();
        });

        it("never returns a soft-deleted event", async () => {
            const row = await makeEvent({ deleted: true, slug: "apagado" });
            expect(await repo.findMany({ citySlug: "sao-paulo" })).toHaveLength(0);
            expect(await repo.findBySlug(row.slug!)).toBeNull();
        });
    });

    describe("BR-DISC-005 — the projection is an allowlist", () => {
        it("exposes no operational data even when the event has plenty", async () => {
            const row = await makeEvent();

            // Give the event exactly the things that must never surface.
            await testDb.insert(eventTeamMember).values({ eventId: row.id, userId, role: "MANAGER" });
            await testDb.insert(doorSaleTier).values({ eventId: row.id, name: "Camarote", price: 150 });

            const found = await repo.findBySlug(row.slug!);
            expect(found).not.toBeNull();

            const serialized = JSON.stringify(found);
            expect(serialized).not.toContain(userId);          // creator / team member
            expect(serialized).not.toContain("Camarote");      // door sale tier
            expect(found).not.toHaveProperty("createdBy");
            expect(found).not.toHaveProperty("deleted");
            expect(found).not.toHaveProperty("sourceUrl");
        });
    });

    describe("BR-DISC-010 / EDGE-1 — only upcoming", () => {
        it("excludes an event that already started", async () => {
            await makeEvent({ startDate: new Date(Date.now() - 3600_000), endDate: inDays(1) });
            expect(await repo.findMany({ citySlug: "sao-paulo" })).toHaveLength(0);
        });

        it("excludes a past event", async () => {
            await makeEvent({ startDate: inDays(-7), endDate: inDays(-6.9) });
            expect(await repo.findMany({ citySlug: "sao-paulo" })).toHaveLength(0);
        });
    });

    describe("BR-DISC-009 / EDGE-3 — city resolution", () => {
        it("lists an event whose city comes from its venue", async () => {
            await makeEvent();
            expect(await repo.findMany({ citySlug: "sao-paulo" })).toHaveLength(1);
        });

        it("lists an inline-location event using its own cityId", async () => {
            await makeEvent({
                venueId: null,
                locationName: "Terraço",
                locationAddress: "Rua X 1",
                cityId,
            });
            const found = await repo.findMany({ citySlug: "sao-paulo" });
            expect(found).toHaveLength(1);
            expect(found[0].venueName).toBe("Terraço");
        });

        it("lists nowhere when neither the event nor its venue has a city", async () => {
            const [{ id: noCityVenue }] = await testDb
                .insert(venue)
                .values({ name: "Sem Cidade", address: "?", createdBy: userId })
                .returning({ id: venue.id });

            const row = await makeEvent({ venueId: noCityVenue, slug: "sem-cidade" });

            expect(await repo.findMany({ citySlug: "sao-paulo" })).toHaveLength(0);
            expect(await repo.findMany({})).toHaveLength(0);
            expect(await repo.findBySlug(row.slug!)).toBeNull();
        });
    });

    describe("BR-DISC-011 — ordering", () => {
        it("orders by start time ascending", async () => {
            await makeEvent({ name: "Depois", startDate: inDays(9) });
            await makeEvent({ name: "Antes", startDate: inDays(8) });
            const found = await repo.findMany({ citySlug: "sao-paulo" });
            expect(found.map((e) => e.name)).toEqual(["Antes", "Depois"]);
        });
    });

    describe("BR-CUR-007 / EDGE-8 — featuring", () => {
        it("includes an event whose feature window covers now", async () => {
            await makeEvent({ featuredFrom: inDays(-1), featuredUntil: inDays(3) });
            expect(await repo.findMany({ featuredOnly: true })).toHaveLength(1);
        });

        it("excludes an event whose feature window has passed", async () => {
            await makeEvent({ featuredFrom: inDays(-10), featuredUntil: inDays(-2) });
            expect(await repo.findMany({ featuredOnly: true })).toHaveLength(0);
        });

        it("excludes an event that was never featured", async () => {
            await makeEvent();
            expect(await repo.findMany({ featuredOnly: true })).toHaveLength(0);
        });
    });

    describe("BR-ART-002 — artist reuse is case-insensitive", () => {
        it("reuses an existing artist regardless of case", async () => {
            const artists = new DrizzlePostgresArtistRepository(testDb as never);

            const first = await artists.findOrCreateMany(["Ana Vega"]);
            const second = await artists.findOrCreateMany(["ana vega", "Dux"]);

            expect(second[0].id).toBe(first[0].id);
            expect(second[0].name).toBe("Ana Vega");
            expect(second).toHaveLength(2);
        });

        it("collapses duplicates within one lineup", async () => {
            const artists = new DrizzlePostgresArtistRepository(testDb as never);
            const result = await artists.findOrCreateMany(["Dux", "DUX", " dux "]);
            expect(result).toHaveLength(1);
        });
    });
});
