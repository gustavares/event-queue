import { ValidationError, ForbiddenError, ConflictError, NotFoundError } from "../common/errors";
import DrizzlePostgresEventRepository, { EventRepository } from "../../repositories/event.repository";
import { PublicEventRepository } from "../../repositories/public-event.repository";
import { PublicEventEntity } from "../../repositories/public-event.entity";
import DrizzlePostgresArtistRepository, { ArtistRepository } from "../../repositories/artist.repository";
import DrizzlePostgresGenreRepository, { GenreRepository } from "../../repositories/genre.repository";
import { CityRepository } from "../../repositories/city.repository";
import { UserEntity } from "../../repositories/user.entity";
import { EventExtractor, ExtractedEvent } from "./common/event-extractor";
import { buildEventSlug, allocateSlug } from "./common/slug";
import { Database } from "../../db";

export interface ConfirmCuratedEventInput {
    sourceUrl: string;
    name: string;
    startDate: Date;
    endDate?: Date;
    cityId: string;
    venueName: string;
    venueAddress: string;
    externalTicketUrl: string;
    description?: string;
    curatorNote?: string;
    lineup?: { name: string; isHeadliner?: boolean }[];
    genreSlugs?: string[];
}

/**
 * Listing third-party events (BR-CUR-001..009).
 *
 * Extraction and persistence are deliberately two separate operations. `extract` reads and
 * returns; `confirm` writes. Nothing a model produced reaches the database without a human
 * passing it back (BR-CUR-003).
 */
export default class CurateEventService {
    constructor(
        private readonly db: Database,
        private readonly eventRepository: EventRepository,
        private readonly publicEventRepository: PublicEventRepository,
        private readonly artistRepository: ArtistRepository,
        private readonly genreRepository: GenreRepository,
        private readonly cityRepository: CityRepository,
        private readonly extractor: EventExtractor
    ) {}

    /** BR-CUR-001. Curation is gated on a capability flag, not an event role. */
    private requireCurator(user: UserEntity | null | undefined): UserEntity {
        if (!user?.isCurator) {
            throw ForbiddenError("You don't have access to that.");
        }
        return user;
    }

    /**
     * Reads a source page and returns fields for review. Writes nothing.
     *
     * BR-CUR-009 is checked here as well as at the database, so the curator is told the
     * event is already listed before spending time reviewing an extraction.
     */
    async extract(user: UserEntity | null | undefined, sourceUrl: string): Promise<ExtractedEvent> {
        this.requireCurator(user);

        const existing = await this.eventRepository.findBySourceUrl(sourceUrl);
        if (existing) {
            throw ConflictError("That event is already listed.");
        }

        return this.extractor.extract(sourceUrl);
    }

    async confirm(
        user: UserEntity | null | undefined,
        input: ConfirmCuratedEventInput
    ): Promise<PublicEventEntity> {
        const curator = this.requireCurator(user);

        if (await this.eventRepository.findBySourceUrl(input.sourceUrl)) {
            throw ConflictError("That event is already listed.");
        }

        // BR-CUR-008 / EDGE-7 — a past start date is a misread, not a valid listing.
        if (input.startDate.getTime() <= Date.now()) {
            throw ValidationError(
                "We couldn't read everything — fill in the highlighted fields."
            );
        }

        // BR-DISC-007 — a curated event must say where tickets are actually sold.
        if (!input.externalTicketUrl.trim()) {
            throw ValidationError(
                "We couldn't read everything — fill in the highlighted fields."
            );
        }

        const endDate =
            input.endDate ?? new Date(input.startDate.getTime() + 6 * 60 * 60 * 1000);

        const slug = await allocateSlug(
            buildEventSlug(input.name, input.startDate),
            (candidate) => this.eventRepository.slugExists(candidate)
        );

        const genres = input.genreSlugs?.length
            ? await this.genreRepository.findBySlugs(input.genreSlugs)
            : [];

        // The event, its lineup and its genres are one listing — a partial write would
        // publish an event with a missing lineup and no way to tell that it was truncated.
        await this.db.transaction(async (tx) => {
            const txEvents = new DrizzlePostgresEventRepository(tx);
            const txArtists = new DrizzlePostgresArtistRepository(tx);
            const txGenres = new DrizzlePostgresGenreRepository(tx);

            const row = await txEvents.create({
                name: input.name,
                description: input.description,
                startDate: input.startDate,
                endDate,
                locationName: input.venueName,
                locationAddress: input.venueAddress,
                createdBy: curator.id,
            });

            await txEvents.setPublication(row.id, {
                visibility: "PUBLIC",
                slug,
                cityId: input.cityId,
            });

            await txEvents.setCuratedSource({
                id: row.id,
                sourceUrl: input.sourceUrl,
                externalTicketUrl: input.externalTicketUrl,
                curatorNote: input.curatorNote ?? null,
            });

            if (input.lineup?.length) {
                await txArtists.replaceLineup(row.id, input.lineup);
            }
            if (genres.length) {
                await txGenres.replaceForEvent(
                    row.id,
                    genres.map((g) => g.id)
                );
            }

            return row;
        });

        const published = await this.publicEventRepository.findBySlug(slug);
        if (!published) {
            throw ValidationError("Add a city before publishing.");
        }
        return published;
    }

    /** BR-CUR-006. Our own copy. */
    async setCuratorNote(
        user: UserEntity | null | undefined,
        eventId: string,
        note: string
    ): Promise<PublicEventEntity> {
        this.requireCurator(user);

        const event = await this.eventRepository.findById(eventId);
        if (!event || !event.slug) {
            throw NotFoundError("This event isn't available.");
        }

        await this.eventRepository.setCuration(eventId, { curatorNote: note });

        const updated = await this.publicEventRepository.findBySlug(event.slug);
        if (!updated) {
            throw NotFoundError("This event isn't available.");
        }
        return updated;
    }

    /** BR-CUR-007. A window entirely in the past simply never matches (EDGE-8). */
    async setFeatured(
        user: UserEntity | null | undefined,
        eventId: string,
        from: Date,
        until: Date
    ): Promise<PublicEventEntity> {
        this.requireCurator(user);

        if (until.getTime() <= from.getTime()) {
            throw ValidationError("The feature window must end after it starts.");
        }

        const event = await this.eventRepository.findById(eventId);
        if (!event || !event.slug) {
            throw NotFoundError("This event isn't available.");
        }

        await this.eventRepository.setCuration(eventId, {
            featuredFrom: from,
            featuredUntil: until,
        });

        const updated = await this.publicEventRepository.findBySlug(event.slug);
        if (!updated) {
            throw NotFoundError("This event isn't available.");
        }
        return updated;
    }
}
