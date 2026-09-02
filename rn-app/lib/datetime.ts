/**
 * Dates and times for the public listing.
 *
 * Every formatter here renders in the **listing's** timezone, not the viewer's device
 * timezone. A Brazilian club night at 23:00 must read "23:00" to a reader in London, and it
 * must sit under the date it actually happens on. Formatting in the device timezone shifted
 * both, so a visitor abroad saw the wrong time and, past midnight UTC, the wrong day —
 * silently breaking EDGE-2 (an event crossing midnight belongs to its start date).
 *
 * The zone matches `LISTING_TIME_ZONE` in backend/src/domain/discovery/common/slug.ts, which
 * is what event slugs are dated from. If the two ever disagree, a shared link will name a
 * different day than the page it opens.
 *
 * Every covered city is currently in São Paulo time. When one is not — Manaus is UTC-4,
 * Fernando de Noronha UTC-2 — this must take the zone from the event's city.
 */
export const LISTING_TIME_ZONE = 'America/Sao_Paulo';

/** pt-BR: the audience is Brazilian, so months and weekdays read in Portuguese. */
const LOCALE = 'pt-BR';

function parse(value: string | Date): Date {
    return typeof value === 'string' ? new Date(value) : value;
}

/** "23:00" */
export function formatListingTime(value: string | Date): string {
    return new Intl.DateTimeFormat(LOCALE, {
        timeZone: LISTING_TIME_ZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(parse(value));
}

/** "SÁB, 6 SET" — for rows that appear outside a date-grouped list. */
export function formatShortDate(value: string | Date): string {
    return new Intl.DateTimeFormat(LOCALE, {
        timeZone: LISTING_TIME_ZONE,
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    })
        .format(parse(value))
        .toUpperCase()
        // pt-BR abbreviates as "dom.", "6 de set." — the dots read as noise in a compact
        // two-line stamp, so drop them all rather than only a trailing one.
        .replace(/\./g, '');
}

/** "sábado, 6 de setembro · 23:00" — the event page's full line. */
export function formatFullDate(value: string | Date): string {
    const d = parse(value);
    const date = new Intl.DateTimeFormat(LOCALE, {
        timeZone: LISTING_TIME_ZONE,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    }).format(d);
    return `${date} · ${formatListingTime(d)}`;
}

/** "SÁBADO, 6 DE SETEMBRO" — a date-group heading. */
export function formatDateHeading(value: string | Date): string {
    return new Intl.DateTimeFormat(LOCALE, {
        timeZone: LISTING_TIME_ZONE,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    })
        .format(parse(value))
        .toUpperCase();
}

/**
 * A stable YYYY-MM-DD key for grouping, in the listing's timezone.
 *
 * Grouping previously used `getFullYear/getMonth/getDate`, which are the VIEWER's local
 * calendar fields — so the same event landed in different date groups depending on where the
 * reader was sitting.
 */
export function listingDateKey(value: string | Date): string {
    // en-CA already formats as YYYY-MM-DD.
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: LISTING_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(parse(value));
}
