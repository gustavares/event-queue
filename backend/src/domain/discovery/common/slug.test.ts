import { buildEventSlug, slugifyText, allocateSlug } from "./slug";
import { withMissingFields, type ExtractedEvent } from "./event-extractor";

describe("slugifyText", () => {
    it("strips accents rather than dropping the letters", () => {
        // "Réveillon" losing its é to a naive [^a-z0-9] filter would give "rveillon".
        expect(slugifyText("Réveillon")).toBe("reveillon");
        expect(slugifyText("Galpão Zona Leste")).toBe("galpao-zona-leste");
        expect(slugifyText("Forró & Cia")).toBe("forro-cia");
    });

    it("never leaves leading or trailing separators", () => {
        expect(slugifyText("  ...Bunker 012!  ")).toBe("bunker-012");
    });

    it("falls back for a name with nothing slugifiable", () => {
        expect(buildEventSlug("!!!", new Date("2026-09-05T23:00:00-03:00"))).toMatch(/^evento-/);
    });
});

describe("buildEventSlug — the date is the LISTING's date, not UTC", () => {
    it("dates a late-night Brazilian event to the night it starts", () => {
        // 23:00 on Sat 5 Sep in São Paulo is 02:00 UTC on Sun 6 Sep. Building the slug from
        // UTC calendar fields dated it "…-09-06" — a Saturday night permanently advertised
        // as Sunday, and slugs are never reallocated.
        const saturdayNight = new Date("2026-09-05T23:00:00-03:00");
        expect(buildEventSlug("Bunker 012", saturdayNight)).toBe("bunker-012-2026-09-05");
    });

    it("agrees with the date for an evening event well inside the day", () => {
        const earlyEvening = new Date("2026-09-05T18:00:00-03:00");
        expect(buildEventSlug("Sunset Sessions", earlyEvening)).toBe(
            "sunset-sessions-2026-09-05"
        );
    });

    it("rolls to the next day only after local midnight", () => {
        const afterMidnight = new Date("2026-09-06T01:00:00-03:00");
        expect(buildEventSlug("Depois", afterMidnight)).toBe("depois-2026-09-06");
    });
});

describe("allocateSlug", () => {
    it("returns the candidate when it is free", async () => {
        expect(await allocateSlug("livre", async () => false)).toBe("livre");
    });

    it("suffixes past a taken slug", async () => {
        const taken = new Set(["festa", "festa-2"]);
        expect(await allocateSlug("festa", async (s) => taken.has(s))).toBe("festa-3");
    });

    it("throws a typed error rather than a plain one when it cannot allocate", async () => {
        // A plain Error would be masked by Yoga as "Unexpected error."
        await expect(allocateSlug("cheio", async () => true)).rejects.toMatchObject({
            extensions: { code: "CONFLICT" },
        });
    });
});

describe("withMissingFields — BR-CUR-008", () => {
    const base: ExtractedEvent = {
        sourceUrl: "https://example.com/x",
        lineup: [],
        missingFields: [],
    };

    it("reports every required field the extractor could not read", () => {
        expect(withMissingFields(base).missingFields.sort()).toEqual(
            ["name", "startDate", "venueName"].sort()
        );
    });

    it("reports nothing when everything required is present", () => {
        const complete: ExtractedEvent = {
            ...base,
            name: "Bunker 012",
            startDate: new Date(Date.now() + 7 * 864e5),
            venueName: "Galpão",
        };
        expect(withMissingFields(complete).missingFields).toEqual([]);
    });

    it("treats a start date in the past as missing (EDGE-7)", () => {
        // The most likely misread: a page with no year, or a recurring-event template.
        const stale: ExtractedEvent = {
            ...base,
            name: "Antigo",
            startDate: new Date(Date.now() - 864e5),
            venueName: "Galpão",
        };
        expect(withMissingFields(stale).missingFields).toContain("startDate");
    });

    it("keeps fields the extractor itself flagged", () => {
        const flagged: ExtractedEvent = {
            ...base,
            name: "X",
            startDate: new Date(Date.now() + 864e5),
            venueName: "Y",
            missingFields: ["priceFrom"],
        };
        expect(withMissingFields(flagged).missingFields).toContain("priceFrom");
    });
});
