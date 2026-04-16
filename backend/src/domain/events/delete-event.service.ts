import type { EventRepository } from "../../repositories/event.repository";
import type { EventTeamMemberRepository } from "../../repositories/event-team-member.repository";

export interface DeleteEventData {
    eventId: string;
    userId: string;
}

export default class DeleteEventService {
    constructor(
        private readonly eventRepository: EventRepository,
        private readonly eventTeamMemberRepository: EventTeamMemberRepository
    ) {}

    async run(input: DeleteEventData): Promise<void> {
        const event = await this.eventRepository.findById(input.eventId);
        if (!event) {
            throw new Error("Event not found");
        }

        const membership = await this.eventTeamMemberRepository.findByEventAndUser(
            input.eventId,
            input.userId
        );
        if (!membership || membership.role !== "MANAGER") {
            throw new Error("You do not have permission to edit this event");
        }

        await this.eventRepository.softDelete(input.eventId);
    }
}
