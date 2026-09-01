import type { AppGraphQLContext } from "../../graphql.types";
import type { PublicEventEntity } from "../../../repositories/public-event.entity";
import type { CityEntity } from "../../../repositories/city.entity";
import type { GenreEntity } from "../../../repositories/genre.entity";
import type { ArtistEntity } from "../../../repositories/artist.entity";

/**
 * Unauthenticated read handlers.
 *
 * These deliberately do NOT call requireAuth — see ./README.md. They are the entire
 * public surface of the API.
 */

export async function cities(
    _parent: unknown,
    _args: unknown,
    context: AppGraphQLContext
): Promise<CityEntity[]> {
    return context.services.getPublicEventsService.listCities();
}

export async function genres(
    _parent: unknown,
    _args: unknown,
    context: AppGraphQLContext
): Promise<GenreEntity[]> {
    return context.services.getPublicEventsService.listGenres();
}

export async function publicEvents(
    _parent: unknown,
    args: {
        citySlug?: string;
        genreSlugs?: string[];
        startsBefore?: Date;
        artistId?: string;
    },
    context: AppGraphQLContext
): Promise<PublicEventEntity[]> {
    return context.services.getPublicEventsService.list({
        citySlug: args.citySlug,
        genreSlugs: args.genreSlugs,
        startsBefore: args.startsBefore,
        artistId: args.artistId,
    });
}

export async function featuredEvents(
    _parent: unknown,
    args: { citySlug: string },
    context: AppGraphQLContext
): Promise<PublicEventEntity[]> {
    return context.services.getPublicEventsService.listFeatured(args.citySlug);
}

export async function publicEvent(
    _parent: unknown,
    args: { slug: string },
    context: AppGraphQLContext
): Promise<PublicEventEntity> {
    return context.services.getPublicEventsService.getBySlug(args.slug);
}

export async function artist(
    _parent: unknown,
    args: { id: string },
    context: AppGraphQLContext
): Promise<ArtistEntity> {
    return context.services.getPublicEventsService.getArtist(args.id);
}

export async function subscribeToCity(
    _parent: unknown,
    args: { email: string; citySlug: string },
    context: AppGraphQLContext
) {
    return context.services.subscribeService.run(args);
}
