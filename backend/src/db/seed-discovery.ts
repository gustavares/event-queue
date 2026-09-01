import * as dotenv from "dotenv";
import * as path from "path";
import { db } from "./index";
import { city, genre } from "./schema";

/**
 * Seeds the reference data discovery needs to function: the cities we cover and the genre
 * vocabulary events are filtered by.
 *
 * Idempotent — safe to re-run. Both tables key on `slug`.
 *
 *   pnpm db:seed
 */

const CITIES = [
    { name: "São Paulo", state: "SP", slug: "sao-paulo" },
    { name: "Rio de Janeiro", state: "RJ", slug: "rio-de-janeiro" },
    { name: "Belo Horizonte", state: "MG", slug: "belo-horizonte" },
    { name: "Curitiba", state: "PR", slug: "curitiba" },
    { name: "Porto Alegre", state: "RS", slug: "porto-alegre" },
];

// Deliberately shaped around Brazilian nightlife rather than a generic genre list.
const GENRES = [
    { name: "Techno", slug: "techno" },
    { name: "House", slug: "house" },
    { name: "Funk", slug: "funk" },
    { name: "Sertanejo", slug: "sertanejo" },
    { name: "Samba", slug: "samba" },
    { name: "Pagode", slug: "pagode" },
    { name: "Forró", slug: "forro" },
    { name: "Rap / Hip-Hop", slug: "rap-hip-hop" },
    { name: "Rock", slug: "rock" },
    { name: "Drum & Bass", slug: "drum-and-bass" },
    { name: "Pop", slug: "pop" },
    { name: "MPB", slug: "mpb" },
];

async function main() {
    dotenv.config({ path: path.resolve(__dirname, "../../.env") });

    await db.insert(city).values(CITIES).onConflictDoNothing({ target: city.slug });
    await db.insert(genre).values(GENRES).onConflictDoNothing({ target: genre.slug });

    const cities = await db.select().from(city);
    const genres = await db.select().from(genre);

    console.log(`Seeded ${cities.length} cities and ${genres.length} genres.`);
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
