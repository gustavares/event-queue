import { NotFoundError } from "../common/errors";
import { PublicEventEntity } from "../../repositories/public-event.entity";
import { PublicEventRepository } from "../../repositories/public-event.repository";
import { CityRepository } from "../../repositories/city.repository";
import { GenreEntity } from "../../repositories/genre.entity";
import { GenreRepository } from "../../repositories/genre.repository";
import { LineupEntryEntity, ArtistEntity } from "../../repositories/artist.entity";
import { ArtistRepository } from "../../repositories/artist.repository";

export interface ListPublicEventsInput {
    citySlug?: string;
    genreSlugs?: string[];
    startsBefore?: Date;
    artistId?: string;
}

/**
 * Public, unauthenticated reads.
 *
 * This is the only service reachable without a session, so it is the only place where a
 * visibility mistake becomes a data leak. It never accepts an "include unlisted" flag —
 * there is no code path through here that returns a non-public event.
 */
export default class GetPublicEventsService {
    constructor(
        private readonly publicEventRepository: PublicEventRepository,
        private readonly cityRepository: CityRepository,
        private readonly genreRepository: GenreRepository,
        private readonly artistRepository: ArtistRepository
    ) {}

    async listCities() {
        return this.cityRepository.findAll();
    }

    async cityById(id: string) {
        return this.cityRepository.findById(id);
    }

    async listGenres(): Promise<GenreEntity[]> {
        return this.genreRepository.findAll();
    }

    /** Throws the spec's copy when the city is not covered. */
    async requireCity(citySlug: string) {
        const found = await this.cityRepository.findBySlug(citySlug);
        if (!found) {
            throw NotFoundError("We don't cover that city yet.");
        }
        return found;
    }

    async list(input: ListPublicEventsInput): Promise<PublicEventEntity[]> {
        if (input.citySlug) {
            await this.requireCity(input.citySlug);
        }

        return this.publicEventRepository.findMany({
            citySlug: input.citySlug,
            genreSlugs: input.genreSlugs,
            startsBefore: input.startsBefore,
            artistId: input.artistId,
        });
    }

    /** BR-CUR-007 — events whose feature window currently covers now. */
    async listFeatured(citySlug: string): Promise<PublicEventEntity[]> {
        await this.requireCity(citySlug);
        return this.publicEventRepository.findMany({ citySlug, featuredOnly: true });
    }

    /**
     * A single event by slug.
     *
     * Returns the same error for "no such slug" and "exists but is unlisted" so the API
     * cannot be used to discover which events exist privately.
     */
    async getBySlug(slug: string): Promise<PublicEventEntity> {
        const found = await this.publicEventRepository.findBySlug(slug);
        if (!found) {
            throw NotFoundError("This event isn't available.");
        }
        return found;
    }

    async getArtist(id: string): Promise<ArtistEntity> {
        const found = await this.artistRepository.findById(id);
        if (!found) {
            throw NotFoundError("This event isn't available.");
        }
        return found;
    }

    async lineupFor(eventId: string): Promise<LineupEntryEntity[]> {
        return this.artistRepository.findLineupByEventId(eventId);
    }

    async genresFor(eventId: string): Promise<GenreEntity[]> {
        return this.genreRepository.findByEventId(eventId);
    }
}
