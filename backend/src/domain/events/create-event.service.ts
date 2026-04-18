import { z } from "zod";
import type { EventRepository } from "../../repositories/event.repository";
import type { EventTeamMemberRepository } from "../../repositories/event-team-member.repository";
import type { EventEntity } from "../../repositories/event.entity";
import type { Database } from "../../db";
import DrizzlePostgresEventRepository from "../../repositories/event.repository";
import DrizzlePostgresEventTeamMemberRepository from "../../repositories/event-team-member.repository";

export interface CreateEventData {
    name: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    venueId?: string;
    locationName?: string;
    locationAddress?: string;
    doorSalesEnabled?: boolean;
    userId: string;
}

const schema = z
    .object({
        name: z.string().min(1),
        description: z.string().optional(),
        startDate: z.date(),
        endDate: z.date().optional(),
        venueId: z.string().optional(),
        locationName: z.string().optional(),
        locationAddress: z.string().optional(),
        doorSalesEnabled: z.boolean().optional(),
        userId: z.string(),
    })
    .refine(
        (data) =>
            data.venueId || (data.locationName && data.locationAddress),
        { message: "Please select a venue or provide a location" }
    )
    .refine(
        (data) => data.startDate > new Date(),
        { message: "Start time cannot be in the past" }
    )
    .refine(
        (data) => !data.endDate || data.endDate > data.startDate,
        { message: "End time must be after start time" }
    );

export default class CreateEventService {
    constructor(
        private readonly db: Database,
        private readonly eventRepository: EventRepository,
        private readonly eventTeamMemberRepository: EventTeamMemberRepository
    ) {}

    async run(input: CreateEventData): Promise<EventEntity> {
        const validated = schema.parse(input);

        const endDate = validated.endDate ?? new Date(validated.startDate.getTime() + 12 * 60 * 60 * 1000);
        const locationName = validated.venueId ? undefined : validated.locationName;
        const locationAddress = validated.venueId ? undefined : validated.locationAddress;

        return await this.db.transaction(async (tx) => {
            const txEventRepo = new DrizzlePostgresEventRepository(tx);
            const txTeamRepo = new DrizzlePostgresEventTeamMemberRepository(tx);

            const event = await txEventRepo.create({
                name: validated.name,
                description: validated.description,
                startDate: validated.startDate,
                endDate,
                venueId: validated.venueId,
                locationName,
                locationAddress,
                doorSalesEnabled: validated.doorSalesEnabled,
                createdBy: validated.userId,
            });

            await txTeamRepo.create({
                eventId: event.id,
                userId: validated.userId,
                role: "MANAGER",
            });

            return event;
        });
    }
}
