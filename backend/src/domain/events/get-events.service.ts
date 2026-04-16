import type { EventRepository } from "../../repositories/event.repository";
import type { EventTeamMemberRepository } from "../../repositories/event-team-member.repository";
import type { EventEntity } from "../../repositories/event.entity";

export default class GetEventsService {
    constructor(
        private readonly eventRepository: EventRepository,
        private readonly eventTeamMemberRepository: EventTeamMemberRepository
    ) {}

    async getById(eventId: string, userId: string): Promise<EventEntity> {
        const event = await this.eventRepository.findById(eventId);
        if (!event) {
            throw new Error("Event not found");
        }

        const membership = await this.eventTeamMemberRepository.findByEventAndUser(eventId, userId);
        if (!membership) {
            throw new Error("You do not have permission to view this event");
        }

        return this.applyAutoClose(event);
    }

    async listByCreator(userId: string): Promise<EventEntity[]> {
        const events = await this.eventRepository.findByCreator(userId);
        const results: EventEntity[] = [];

        for (const event of events) {
            results.push(await this.applyAutoClose(event));
        }

        return results;
    }

    private async applyAutoClose(event: EventEntity): Promise<EventEntity> {
        if (event.status === "ACTIVE" && event.endDate < new Date()) {
            return this.eventRepository.update(event.id, { status: "FINISHED" });
        }
        return event;
    }
}
