import type { EventRepository } from "../../repositories/event.repository";
import type { EventTeamMemberRepository } from "../../repositories/event-team-member.repository";
import type { EventEntity, EventStatus } from "../../repositories/event.entity";

export interface TransitionEventData {
    eventId: string;
    userId: string;
    targetStatus: EventStatus;
}

const ALLOWED_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
    DRAFT: ["ACTIVE", "CANCELLED"],
    ACTIVE: ["FINISHED", "CANCELLED"],
    FINISHED: ["ACTIVE"],
    CANCELLED: [],
};

export default class TransitionEventService {
    constructor(
        private readonly eventRepository: EventRepository,
        private readonly eventTeamMemberRepository: EventTeamMemberRepository
    ) {}

    async run(input: TransitionEventData): Promise<EventEntity> {
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

        const allowed = ALLOWED_TRANSITIONS[event.status];
        if (!allowed.includes(input.targetStatus)) {
            throw new Error("This event cannot be changed to that status");
        }

        return this.eventRepository.update(input.eventId, { status: input.targetStatus });
    }
}
