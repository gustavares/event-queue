import { ConflictError } from "../../common/errors";
/**
 * Slug generation for public event URLs (BR-DISC-008).
 *
 * Slugs are allocated on first publish and never released, so they must be stable and
 * collision-free for the life of the database.
 */

/** Strips accents so "Réveillon" becomes "reveillon" rather than "rveillon". */
function deaccent(value: string): string {
    return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function slugifyText(value: string): string {
    return deaccent(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60)
        .replace(/-+$/g, "");
}

/**
 * The timezone the listing's calendar dates are reckoned in.
 *
 * Slugs must agree with the date a reader sees on the listing. Using UTC put every event
 * starting after 21:00 Brazilian time onto the following day — a 23:00 Saturday night
 * became "…-sunday", permanently, because slugs are never reallocated.
 *
 * A single project-wide zone is correct for now: every covered city is in São Paulo time.
 * When a covered city sits in another zone (Manaus is UTC-4, Fernando de Noronha UTC-2),
 * this must become per-city and the slug must be built from the event's own city.
 */
const LISTING_TIME_ZONE = "America/Sao_Paulo";

/** The Y-M-D calendar date of an instant, in the listing's timezone. */
export function listingDateParts(date: Date, timeZone: string = LISTING_TIME_ZONE) {
    // en-CA formats as YYYY-MM-DD, which is already the shape we want.
    const formatted = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);

    const [year, month, day] = formatted.split("-");
    return { year, month, day };
}

/**
 * Builds the candidate slug for an event: name plus its date.
 *
 * The date is included because venues run the same night repeatedly — "noite-carioca"
 * alone would collide every month and force a numeric suffix each time.
 */
export function buildEventSlug(name: string, startDate: Date): string {
    const base = slugifyText(name) || "evento";
    const { year, month, day } = listingDateParts(startDate);
    return `${base}-${year}-${month}-${day}`;
}

/**
 * Returns the first candidate not already taken.
 *
 * `isTaken` is injected so this stays a pure function the caller can test without a
 * database, and so the caller decides what "taken" means.
 */
export async function allocateSlug(
    candidate: string,
    isTaken: (slug: string) => Promise<boolean>
): Promise<string> {
    if (!(await isTaken(candidate))) return candidate;

    for (let suffix = 2; suffix < 100; suffix++) {
        const next = `${candidate}-${suffix}`;
        if (!(await isTaken(next))) return next;
    }

    // A typed error, not a plain one: Yoga masks anything that is not a GraphQLError to
    // "Unexpected error." See docs/patterns.md § Error handling.
    throw ConflictError("We couldn't create a link for that event. Try a different name.");
}
