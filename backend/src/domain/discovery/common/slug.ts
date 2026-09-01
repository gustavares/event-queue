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
 * Builds the candidate slug for an event: name plus its date.
 *
 * The date is included because venues run the same night repeatedly — "noite-carioca"
 * alone would collide every month and force a numeric suffix each time.
 */
export function buildEventSlug(name: string, startDate: Date): string {
    const base = slugifyText(name) || "evento";
    const yyyy = startDate.getUTCFullYear();
    const mm = String(startDate.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(startDate.getUTCDate()).padStart(2, "0");
    return `${base}-${yyyy}-${mm}-${dd}`;
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

    throw new Error(`Could not allocate a slug for "${candidate}" after 99 attempts.`);
}
