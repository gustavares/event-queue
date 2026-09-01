import Anthropic from "@anthropic-ai/sdk";
import { ValidationError } from "../../common/errors";
import {
    EventExtractor,
    ExtractedEvent,
    withMissingFields,
} from "./event-extractor";

/**
 * Reads a public event page and extracts the **facts** we are allowed to list.
 *
 * BR-CUR-004 is enforced in three places, because one is not enough:
 *   1. `ExtractedEvent` has no description or image field — nowhere to put prose.
 *   2. The output schema below has no such property either.
 *   3. The prompt says so explicitly.
 *
 * The model never decides whether something is published. It returns fields; a human
 * confirms them (BR-CUR-003).
 */

const MODEL = "claude-opus-5";

/**
 * Stable prefix — cached so repeated ingestions only pay for the page itself.
 * Nothing volatile may appear before the last cache breakpoint, or the cache never hits.
 */
const SYSTEM_PROMPT = `You extract factual listing details from event pages for a nightlife listings site in Brazil.

You return FACTS ONLY: event name, date and time, venue name, venue address, the lineup of
performing artists, the lowest ticket price, and the ticket purchase URL.

You must NOT return, summarise, translate or paraphrase the page's own description, marketing
copy, or any image. That text is the publisher's copyright. The listings site writes its own
description separately. There is no field for it and you must not invent one.

Rules:
- Report only what the page actually states. Never infer or guess.
- If a field is not clearly stated, omit it and add its name to missingFields.
- Dates: return ISO 8601 with an explicit timezone offset. Brazilian pages are usually
  America/Sao_Paulo (-03:00) unless the page says otherwise. If the year is not stated,
  treat the date as unknown rather than assuming the current year.
- Lineup: performing artists only. Not the venue, promoter, or sponsor. Mark the headliner
  when the page makes it clear (largest billing, "apresenta", top of the poster).
- Price: the lowest advertised entry price as a number in BRL. Ignore fees.`;

const EXTRACTION_TOOL: Anthropic.Tool = {
    name: "record_event_facts",
    description:
        "Record the factual listing details found on the page. Omit any field the page does not clearly state.",
    input_schema: {
        type: "object",
        properties: {
            name: { type: "string", description: "The event's own name." },
            startDate: {
                type: "string",
                description: "ISO 8601 start, with timezone offset.",
            },
            endDate: {
                type: "string",
                description: "ISO 8601 end, with timezone offset. Omit if not stated.",
            },
            venueName: { type: "string" },
            venueAddress: { type: "string" },
            lineup: {
                type: "array",
                description: "Performing artists, in billing order.",
                items: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        isHeadliner: { type: "boolean" },
                    },
                    required: ["name", "isHeadliner"],
                    additionalProperties: false,
                },
            },
            priceFrom: {
                type: "number",
                description: "Lowest advertised entry price in BRL, excluding fees.",
            },
            ticketUrl: { type: "string", description: "Where tickets are actually sold." },
            missingFields: {
                type: "array",
                description:
                    "Names of fields the page does not clearly state. Prefer listing a field here over guessing it.",
                items: { type: "string" },
            },
        },
        required: ["lineup", "missingFields"],
        additionalProperties: false,
    },
    strict: true,
};

/** Page text is truncated rather than sent whole — listings live near the top. */
const MAX_PAGE_CHARS = 40_000;

export default class AnthropicEventExtractor implements EventExtractor {
    constructor(
        private readonly client: Anthropic,
        private readonly fetchPage: (url: string) => Promise<string> = defaultFetchPage
    ) {}

    async extract(sourceUrl: string): Promise<ExtractedEvent> {
        let pageText: string;
        try {
            pageText = await this.fetchPage(sourceUrl);
        } catch {
            throw ValidationError("We couldn't read that page. Enter the details manually.");
        }

        if (!pageText.trim()) {
            throw ValidationError("We couldn't read that page. Enter the details manually.");
        }

        const response = await this.client.messages.create({
            model: MODEL,
            max_tokens: 4096,
            system: [
                {
                    type: "text",
                    text: SYSTEM_PROMPT,
                    cache_control: { type: "ephemeral" },
                },
            ],
            tools: [EXTRACTION_TOOL],
            tool_choice: { type: "tool", name: "record_event_facts" },
            messages: [
                {
                    role: "user",
                    content: `Extract the listing facts from this page.\n\nURL: ${sourceUrl}\n\n---\n${pageText.slice(0, MAX_PAGE_CHARS)}`,
                },
            ],
        });

        if (response.stop_reason === "refusal") {
            throw ValidationError("We couldn't read that page. Enter the details manually.");
        }

        const toolUse = response.content.find(
            (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
        );
        if (!toolUse) {
            throw ValidationError("We couldn't read that page. Enter the details manually.");
        }

        return withMissingFields(toExtractedEvent(sourceUrl, toolUse.input as RawFacts));
    }
}

interface RawFacts {
    name?: string;
    startDate?: string;
    endDate?: string;
    venueName?: string;
    venueAddress?: string;
    lineup?: { name: string; isHeadliner?: boolean }[];
    priceFrom?: number;
    ticketUrl?: string;
    missingFields?: string[];
}

/** An unparseable date is treated as absent, not as an Invalid Date that flows onward. */
function parseDate(value: string | undefined): Date | undefined {
    if (!value) return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function toExtractedEvent(sourceUrl: string, raw: RawFacts): ExtractedEvent {
    return {
        sourceUrl,
        name: raw.name,
        startDate: parseDate(raw.startDate),
        endDate: parseDate(raw.endDate),
        venueName: raw.venueName,
        venueAddress: raw.venueAddress,
        lineup: (raw.lineup ?? []).map((entry) => ({
            name: entry.name,
            isHeadliner: entry.isHeadliner ?? false,
        })),
        priceFrom: raw.priceFrom,
        ticketUrl: raw.ticketUrl,
        missingFields: raw.missingFields ?? [],
    };
}

/** Strips markup so the model reads text rather than the page's HTML. */
async function defaultFetchPage(url: string): Promise<string> {
    const response = await fetch(url, {
        headers: { "User-Agent": "EventQueue/1.0 (+https://eventqueue.app)" },
        signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
        throw new Error(`Source responded ${response.status}`);
    }

    const html = await response.text();
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
