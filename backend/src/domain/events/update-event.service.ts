import { z } from "zod";
import type { EventRepository } from "../../repositories/event.repository";
import type { EventTeamMemberRepository } from "../../repositories/event-team-member.repository";
import type { EventEntity } from "../../repositories/event.entity";

export interface UpdateEventData {
    eventId: string;
    userId: string;
    name?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    venueId?: string;
    locationName?: string;
    locationAddress?: string;
    doorSalesEnabled?: boolean;
}

const schema = z
    .object({
        eventId: z.string(),
        userId: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        venueId: z.string().optional(),
        locationName: z.string().optional(),
        locationAddress: z.string().optional(),
        doorSalesEnabled: z.boolean().optional(),
    })
    .refine(
        (data) => {
            if (data.endDate && data.startDate) {
                return data.endDate > data.startDate;
            }
            return true;
        },
        { message: "End time must be after start time" }
    );

export default class UpdateEventService {
    constructor(
        private readonly eventRepository: EventRepository,
        private readonly eventTeamMemberRepository: EventTeamMemberRepository
    ) {}

    async run(input: UpdateEventData): Promise<EventEntity> {
        const validated = schema.parse(input);

        const event = await this.eventRepository.findById(validated.eventId);
        if (!event) {
            throw new Error("Event not found");
        }

        const membership = await this.eventTeamMemberRepository.findByEventAndUser(
            validated.eventId,
            validated.userId
        );
        if (!membership || membership.role !== "MANAGER") {
            throw new Error("You do not have permission to edit this event");
        }

        const locationName = validated.venueId !== undefined ? null : validated.locationName;
        const locationAddress = validated.venueId !== undefined ? null : validated.locationAddress;

        return this.eventRepository.update(validated.eventId, {
            name: validated.name,
            description: validated.description,
            startDate: validated.startDate,
            endDate: validated.endDate,
            venueId: validated.venueId,
            locationName,
            locationAddress,
            doorSalesEnabled: validated.doorSalesEnabled,
        });
    }
}
