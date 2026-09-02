import { ValidationError, ForbiddenError, NotFoundError } from "../common/errors";
import { EventRepository } from "../../repositories/event.repository";
import { EventTeamMemberRepository } from "../../repositories/event-team-member.repository";
import { VenueRepository } from "../../repositories/venue.repository";
import { PublicEventRepository } from "../../repositories/public-event.repository";
import { PublicEventEntity } from "../../repositories/public-event.entity";
import { buildEventSlug, allocateSlug } from "./common/slug";

export interface PublishEventInput {
    eventId: string;
    userId: string;
    /** Required only when the event has an inline location rather than a venue. */
    cityId?: string;
}

/**
 * Manager publishing and unpublishing (AC-27..AC-31).
 *
 * Publishing is the moment a private event becomes visible to the entire internet, so
 * every guard lives here and none of them is optional.
 */
export default class PublishEventService {
    constructor(
        private readonly eventRepository: EventRepository,
        private readonly eventTeamMemberRepository: EventTeamMemberRepository,
        private readonly venueRepository: VenueRepository,
        private readonly publicEventRepository: PublicEventRepository,
        private readonly slugExists: (slug: string) => Promise<boolean>
    ) {}

    /**
     * Loads an event the caller manages.
     *
     * Absent and not-yours deliberately return the SAME error. Distinguishing them turns the
     * mutation into an existence oracle: any signed-in user could probe ids and learn which
     * events exist from whether they got NOT_FOUND or FORBIDDEN.
     */
    private async requireManager(eventId: string, userId: string) {
        const event = await this.eventRepository.findById(eventId);
        const membership = event
            ? await this.eventTeamMemberRepository.findByEventAndUser(eventId, userId)
            : null;

        if (!event || !membership || membership.role !== "MANAGER") {
            throw ForbiddenError("You don't have access to that.");
        }

        return event;
    }

    async publish(input: PublishEventInput): Promise<PublicEventEntity> {
        const event = await this.requireManager(input.eventId, input.userId);

        // AC-30 / BR-DISC-013 — a draft is not ready for the public.
        if (event.status === "DRAFT") {
            throw ValidationError("Publish the event to your team before listing it publicly.");
        }

        // AC-29 / BR-DISC-009 — resolve the city, or refuse. Never guess.
        // An explicitly supplied cityId wins: a Manager correcting the city of an event
        // whose venue is unset or wrong must be able to.
        let venueCityId: string | null = null;
        if (event.venueId) {
            const venue = await this.venueRepository.findById(event.venueId);
            venueCityId = venue?.cityId ?? null;
        }

        const cityId = input.cityId ?? event.cityId ?? venueCityId;
        if (!cityId) {
            throw ValidationError("Add a city before publishing.");
        }

        // The event stores an OVERRIDE, never a copy. When the resolved city is the one the
        // venue already supplies, clear the column so the venue stays the single source of
        // truth and the listing follows it if the venue is later corrected. Only a city that
        // differs from the venue's is worth persisting on the event.
        //
        // The previous form — `venueCityId === cityId ? event.cityId : cityId` — wrote the
        // event's own stale cityId back whenever the supplied city matched the venue, so a
        // Manager could never correct a wrong city; and it left the two columns disagreeing,
        // which the listing join then read as two separate cities.
        const cityOverride = cityId === venueCityId ? null : cityId;

        // BR-DISC-008 / EDGE-9 — allocate once, then never change it. Re-publishing an
        // event that was previously public must reuse its original slug so old links work.
        const slug =
            event.slug ??
            (await allocateSlug(buildEventSlug(event.name, event.startDate), this.slugExists));

        await this.eventRepository.setPublication(input.eventId, {
            visibility: "PUBLIC",
            slug,
            cityId: cityOverride,
        });

        const published = await this.publicEventRepository.findBySlug(slug);
        if (!published) {
            // Defensive: the event was just made public, so it must be readable.
            throw ValidationError("Add a city before publishing.");
        }
        return published;
    }

    async unpublish(input: { eventId: string; userId: string }): Promise<boolean> {
        await this.requireManager(input.eventId, input.userId);

        // The slug is deliberately NOT cleared (EDGE-9): an old shared link must resolve
        // to "This event isn't available.", never to a different event that reused it.
        await this.eventRepository.setPublication(input.eventId, { visibility: "UNLISTED" });
        return true;
    }
}
