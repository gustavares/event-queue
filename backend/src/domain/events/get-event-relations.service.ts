import { UserEntity } from "../../repositories/user.entity";
import { UserRepository } from "../../repositories/user.repository";
import { DoorSaleTierEntity } from "../../repositories/door-sale-tier.entity";
import { DoorSaleTierRepository } from "../../repositories/door-sale-tier.repository";

/**
 * Backs the `Event` type resolvers.
 *
 * Type resolvers load related data, which is still data access, so it goes through a
 * service like everything else (docs/patterns.md § The layering rule). Before this
 * existed, `Event.createdBy` built a raw Drizzle query inside the resolver file and
 * bypassed the repository's soft-delete filter — a deleted user was still returned.
 */
export default class GetEventRelationsService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly doorSaleTierRepository: DoorSaleTierRepository
    ) {}

    async creator(userId: string): Promise<UserEntity | null> {
        return this.userRepository.findById(userId);
    }

    async doorSaleTiers(eventId: string): Promise<DoorSaleTierEntity[]> {
        return this.doorSaleTierRepository.findByEventId(eventId);
    }
}
