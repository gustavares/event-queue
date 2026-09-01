/**
 * Reading event facts off a third-party page (BR-CUR-002/004).
 *
 * There is deliberately **no `description` and no image field** on `ExtractedEvent`. The
 * source's prose and photographs are copyrighted; only the facts are ours to list. Leaving
 * the fields off the type means the extractor has nowhere to put them even if a model
 * returns them — the constraint is structural, not a rule someone has to remember.
 *
 * The interface exists so the Anthropic call is swappable: tests inject a fake, and an
 * environment with no API key gets `UnavailableExtractor`.
 */

export interface ExtractedLineupEntry {
    name: string;
    isHeadliner: boolean;
}

export interface ExtractedEvent {
    sourceUrl: string;
    name?: string;
    startDate?: Date;
    endDate?: Date;
    venueName?: string;
    venueAddress?: string;
    lineup: ExtractedLineupEntry[];
    priceFrom?: number;
    ticketUrl?: string;
    /**
     * Fields the extractor could not determine with confidence.
     *
     * BR-CUR-008 — a non-empty list means the event may be saved as a draft but never
     * published. A guessed value is worse than an admitted gap.
     */
    missingFields: string[];
}

export interface EventExtractor {
    extract(sourceUrl: string): Promise<ExtractedEvent>;
}

/** Fields an event cannot be published without. */
export const REQUIRED_FIELDS = ["name", "startDate", "venueName"] as const;

/**
 * Applies BR-CUR-008 to a raw extraction.
 *
 * A start date in the past counts as missing (EDGE-7): it is the single most likely
 * misread — a page listing "sábado 12" with no year, or a recurring-event template — and
 * publishing it would put a past event at the top of an upcoming listing.
 */
export function withMissingFields(extracted: ExtractedEvent): ExtractedEvent {
    const missing = new Set(extracted.missingFields);

    for (const field of REQUIRED_FIELDS) {
        const value = extracted[field as keyof ExtractedEvent];
        if (value === undefined || value === null || value === "") {
            missing.add(field);
        }
    }

    if (extracted.startDate && extracted.startDate.getTime() <= Date.now()) {
        missing.add("startDate");
    }

    return { ...extracted, missingFields: [...missing] };
}
