import { EventTeamMemberEntity, EventTeamMemberSchema, TeamRole } from "./event-team-member.entity";
import { eventTeamMember } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { Database } from "../db";

export interface EventTeamMemberRepository {
    create(input: { eventId: string; userId: string; role: TeamRole }): Promise<EventTeamMemberEntity>;
    findByEventAndUser(eventId: string, userId: string): Promise<EventTeamMemberEntity | null>;
}

function mapToEntity(row: EventTeamMemberSchema): EventTeamMemberEntity {
    return {
        id: row.id,
        eventId: row.eventId,
        userId: row.userId,
        role: row.role,
        createdAt: row.createdAt,
    };
}

export default class DrizzlePostgresEventTeamMemberRepository implements EventTeamMemberRepository {
    constructor(private db: Database) {}

    async create(input: { eventId: string; userId: string; role: TeamRole }): Promise<EventTeamMemberEntity> {
        const result: EventTeamMemberSchema[] = await this.db
            .insert(eventTeamMember)
            .values({
                eventId: input.eventId,
                userId: input.userId,
                role: input.role,
            })
            .returning();

        return mapToEntity(result[0]);
    }

    async findByEventAndUser(eventId: string, userId: string): Promise<EventTeamMemberEntity | null> {
        const result: EventTeamMemberSchema[] = await this.db
            .select()
            .from(eventTeamMember)
            .where(and(eq(eventTeamMember.eventId, eventId), eq(eventTeamMember.userId, userId)))
            .limit(1);

        return result.length > 0 ? mapToEntity(result[0]) : null;
    }
}
