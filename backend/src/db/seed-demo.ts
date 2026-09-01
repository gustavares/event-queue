import * as dotenv from "dotenv";
import * as path from "path";
import { db } from "./index";
import {
    user,
    city,
    genre,
    venue,
    event,
    eventTeamMember,
    artist,
    eventArtist,
    eventGenre,
    doorSaleTier,
    subscriber,
} from "./schema";
import { eq, inArray } from "drizzle-orm";
import { hashPassword } from "../domain/auth/common/password.service";
import { buildEventSlug } from "../domain/discovery/common/slug";

/**
 * Demo data for manual testing.
 *
 *   pnpm db:seed        # cities + genres (reference data)
 *   pnpm db:seed:demo   # this — accounts, venues, events, lineups
 *
 * Destructive and repeatable: it clears events, venues, artists and subscribers, then
 * rebuilds them. It does NOT touch cities or genres. Run it whenever the demo data has
 * drifted from something worth looking at.
 *
 * Every date is relative to now, so the listing always has upcoming events no matter
 * when this is run.
 */

const PASSWORD = "testpass123";

const ACCOUNTS = [
    { email: "curator@eventqueue.dev", name: "Gus (curator)", isCurator: true },
    { email: "manager@eventqueue.dev", name: "Bia (manager)", isCurator: false },
];

function at(daysFromNow: number, hour: number): Date {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hour, 0, 0, 0);
    return d;
}

async function main() {
    dotenv.config({ path: path.resolve(__dirname, "../../.env") });

    console.log("Clearing demo data…");
    await db.delete(eventGenre);
    await db.delete(eventArtist);
    await db.delete(doorSaleTier);
    await db.delete(eventTeamMember);
    await db.delete(subscriber);
    await db.delete(event);
    await db.delete(venue);
    await db.delete(artist);

    const cities = await db.select().from(city);
    const genres = await db.select().from(genre);
    if (cities.length === 0) {
        throw new Error("No cities. Run `pnpm db:seed` first.");
    }
    const cityBySlug = new Map(cities.map((c) => [c.slug, c]));
    const genreBySlug = new Map(genres.map((g) => [g.slug, g]));
    const sp = cityBySlug.get("sao-paulo")!;
    const rj = cityBySlug.get("rio-de-janeiro")!;

    console.log("Creating accounts…");
    const users: Record<string, string> = {};
    for (const account of ACCOUNTS) {
        const existing = await db.select().from(user).where(eq(user.email, account.email));
        if (existing.length > 0) {
            await db
                .update(user)
                .set({ isCurator: account.isCurator, name: account.name })
                .where(eq(user.email, account.email));
            users[account.email] = existing[0].id;
            continue;
        }
        const [row] = await db
            .insert(user)
            .values({
                email: account.email,
                name: account.name,
                password: await hashPassword(PASSWORD),
                isCurator: account.isCurator,
            })
            .returning({ id: user.id });
        users[account.email] = row.id;
    }
    const curatorId = users["curator@eventqueue.dev"];
    const managerId = users["manager@eventqueue.dev"];

    console.log("Creating venues…");
    const venues: Record<string, string> = {};
    for (const v of [
        { key: "rooftop", name: "Club Rooftop", address: "Rua Augusta 1500, Consolação", cityId: sp.id, owner: managerId },
        { key: "galpao", name: "Galpão Zona Leste", address: "Av. Celso Garcia 2200, Belém", cityId: sp.id, owner: managerId },
        { key: "terraco", name: "Terraço Vila Madalena", address: "Rua Aspicuelta 300", cityId: sp.id, owner: managerId },
        { key: "fabrica", name: "Fábrica Botafogo", address: "Rua Voluntários da Pátria 90", cityId: rj.id, owner: curatorId },
        // EDGE-3: deliberately has no city, so its events must be listed nowhere.
        { key: "semcidade", name: "Bar Sem Cidade", address: "Endereço desconhecido", cityId: null, owner: managerId },
    ]) {
        const [row] = await db
            .insert(venue)
            .values({ name: v.name, address: v.address, cityId: v.cityId, createdBy: v.owner })
            .returning({ id: venue.id });
        venues[v.key] = row.id;
    }

    console.log("Creating artists…");
    const artistIds: Record<string, string> = {};
    for (const name of ["Ana Vega", "Dux", "Marcela R", "MC Boot", "Trio Norte", "Selvagem"]) {
        const [row] = await db
            .insert(artist)
            .values({ name, nameKey: name.toLowerCase() })
            .returning({ id: artist.id });
        artistIds[name] = row.id;
    }

    interface Spec {
        name: string;
        venue: keyof typeof venues;
        owner: string;
        start: Date;
        status?: "DRAFT" | "ACTIVE" | "CANCELLED" | "FINISHED";
        publish?: boolean;
        source?: "FIRST_PARTY" | "CURATED";
        externalTicketUrl?: string;
        sourceUrl?: string;
        note?: string;
        lineup?: [string, boolean][];
        genres?: string[];
        featured?: boolean;
        tiers?: [string, number][];
    }

    const specs: Spec[] = [
        {
            name: "Bunker 012",
            venue: "galpao", owner: managerId, start: at(4, 23), publish: true, featured: true,
            note: "Bunker crew back in the Galpão after two years. If you only do one techno night this month, this is it.",
            lineup: [["Ana Vega", true], ["Dux", false], ["Marcela R", false]],
            genres: ["techno"], tiers: [["Pista", 60], ["Camarote", 150]],
        },
        {
            name: "Noite Carioca",
            venue: "rooftop", owner: managerId, start: at(2, 22), publish: true,
            note: "The rooftop finally has a sound system worth the climb. Go early — the queue after midnight is genuinely grim.",
            lineup: [["Selvagem", true]], genres: ["house"], tiers: [["Pista", 40]],
        },
        {
            name: "Baile da Leste",
            venue: "galpao", owner: managerId, start: at(5, 23), publish: true,
            note: "No frills, no guest list, R$20 at the door. The best funk night on the east side.",
            lineup: [["MC Boot", true]], genres: ["funk"],
        },
        {
            // No lineup — AC-17, the section should be absent rather than empty.
            name: "Sunset Sessions",
            venue: "terraco", owner: managerId, start: at(6, 18), publish: true,
            genres: ["mpb", "samba"],
        },
        {
            // CURATED — we list it, someone else sells the tickets (BR-DISC-007).
            name: "Fábrica Aniversário 12 Anos",
            venue: "fabrica", owner: curatorId, start: at(9, 22), publish: true,
            source: "CURATED",
            externalTicketUrl: "https://example.com/ingressos/fabrica-12-anos",
            sourceUrl: "https://example.com/eventos/fabrica-12-anos",
            note: "Twelve years of the best room in Botafogo. We don't sell these — buy direct.",
            lineup: [["Trio Norte", true], ["Dux", false]], genres: ["pop", "rock"],
        },
        {
            // CANCELLED but still listed until it starts (BR-DISC-012 / EDGE-10).
            name: "Rave do Fim do Mundo",
            venue: "terraco", owner: managerId, start: at(7, 23), publish: true,
            status: "CANCELLED", genres: ["drum-and-bass"],
        },
        {
            // Published but at a venue with no city — must appear nowhere (EDGE-3).
            name: "Festa Fantasma",
            venue: "semcidade", owner: managerId, start: at(8, 22), publish: true,
            genres: ["rock"],
        },
        {
            // Never published — the 404 test. Slug is predictable so you can try it.
            name: "Evento Particular",
            venue: "rooftop", owner: managerId, start: at(10, 22), publish: false,
            genres: ["house"],
        },
        {
            // Already started — must not appear in "upcoming" (EDGE-1).
            name: "Já Começou",
            venue: "rooftop", owner: managerId, start: at(0, 1), publish: true,
            genres: ["house"],
        },
    ];

    console.log("Creating events…");
    const created: { name: string; slug: string | null; listed: boolean; why?: string }[] = [];

    for (const s of specs) {
        const slug = s.publish ? buildEventSlug(s.name, s.start) : null;
        const [row] = await db
            .insert(event)
            .values({
                name: s.name,
                startDate: s.start,
                endDate: new Date(s.start.getTime() + 7 * 36e5),
                status: s.status ?? (s.publish ? "ACTIVE" : "DRAFT"),
                venueId: venues[s.venue],
                createdBy: s.owner,
                visibility: s.publish ? "PUBLIC" : "UNLISTED",
                source: s.source ?? "FIRST_PARTY",
                slug,
                externalTicketUrl: s.externalTicketUrl ?? null,
                sourceUrl: s.sourceUrl ?? null,
                curatorNote: s.note ?? null,
                featuredFrom: s.featured ? at(-1, 0) : null,
                featuredUntil: s.featured ? at(6, 23) : null,
            })
            .returning({ id: event.id });

        await db.insert(eventTeamMember).values({ eventId: row.id, userId: s.owner, role: "MANAGER" });

        if (s.lineup) {
            await db.insert(eventArtist).values(
                s.lineup.map(([name, head], i) => ({
                    eventId: row.id,
                    artistId: artistIds[name],
                    position: i,
                    isHeadliner: head,
                }))
            );
        }
        if (s.genres) {
            const ids = s.genres.map((g) => genreBySlug.get(g)?.id).filter(Boolean) as string[];
            if (ids.length) {
                await db.insert(eventGenre).values(ids.map((genreId) => ({ eventId: row.id, genreId })));
            }
        }
        if (s.tiers) {
            await db.insert(doorSaleTier).values(
                s.tiers.map(([name, price]) => ({ eventId: row.id, name, price }))
            );
        }

        const listed = Boolean(s.publish) && s.venue !== "semcidade" && s.name !== "Já Começou";
        created.push({
            name: s.name,
            slug,
            listed,
            why: !s.publish
                ? "unlisted — use it to test the 404"
                : s.venue === "semcidade"
                  ? "venue has no city (EDGE-3)"
                  : s.name === "Já Começou"
                    ? "already started (EDGE-1)"
                    : undefined,
        });
    }

    console.log("\n─────────────────────────────────────────────");
    console.log("ACCOUNTS  (password for both: " + PASSWORD + ")");
    for (const a of ACCOUNTS) {
        console.log(`  ${a.email.padEnd(28)} ${a.isCurator ? "curator + manager" : "manager only"}`);
    }
    console.log("\nEVENTS");
    for (const c of created) {
        const mark = c.listed ? "public " : "hidden ";
        console.log(`  ${mark} ${c.name.padEnd(30)} ${c.slug ?? "-"}${c.why ? `   (${c.why})` : ""}`);
    }
    console.log("─────────────────────────────────────────────\n");

    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
