import { eventTeamMember } from '../db/schema';
import { InferSelectModel } from 'drizzle-orm';

export type EventTeamMemberSchema = InferSelectModel<typeof eventTeamMember>;

export type TeamRole = 'MANAGER' | 'PROMOTER' | 'HOST';

export interface EventTeamMemberEntity {
    id: string;
    eventId: string;
    userId: string;
    role: TeamRole;
    createdAt: Date;
}
