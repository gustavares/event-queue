import { z } from "zod";
import { DoorSaleTierRepository } from "../../repositories/door-sale-tier.repository";
import { EventTeamMemberRepository } from "../../repositories/event-team-member.repository";
import { DoorSaleTierEntity } from "../../repositories/door-sale-tier.entity";

const addTierSchema = z.object({
    name: z.string().min(1),
    price: z.number().positive(),
});

const updateTierSchema = z.object({
    name: z.string().min(1).optional(),
    price: z.number().positive().optional(),
});

export default class ManageTiersService {
    constructor(
        private doorSaleTierRepository: DoorSaleTierRepository,
        private eventTeamMemberRepository: EventTeamMemberRepository,
    ) {}

    async addTier(
        eventId: string,
        userId: string,
        input: { name: string; price: number },
    ): Promise<DoorSaleTierEntity> {
        const membership = await this.eventTeamMemberRepository.findByEventAndUser(eventId, userId);
        if (!membership || membership.role !== "MANAGER") {
            throw new Error("You do not have permission to manage tiers for this event");
        }

        const result = addTierSchema.safeParse(input);
        if (!result.success) {
            throw new Error("Please provide a tier name and a price greater than zero");
        }

        return this.doorSaleTierRepository.create({
            eventId,
            name: result.data.name,
            price: result.data.price,
        });
    }

    async updateTier(
        tierId: string,
        userId: string,
        input: { name?: string; price?: number },
    ): Promise<DoorSaleTierEntity> {
        const tier = await this.doorSaleTierRepository.findById(tierId);
        if (!tier) {
            throw new Error("Tier not found");
        }

        const membership = await this.eventTeamMemberRepository.findByEventAndUser(tier.eventId, userId);
        if (!membership || membership.role !== "MANAGER") {
            throw new Error("You do not have permission to manage tiers for this event");
        }

        const result = updateTierSchema.safeParse(input);
        if (!result.success) {
            throw new Error("Please provide a tier name and a price greater than zero");
        }

        return this.doorSaleTierRepository.update(tierId, result.data);
    }

    async removeTier(tierId: string, userId: string): Promise<void> {
        const tier = await this.doorSaleTierRepository.findById(tierId);
        if (!tier) {
            throw new Error("Tier not found");
        }

        const membership = await this.eventTeamMemberRepository.findByEventAndUser(tier.eventId, userId);
        if (!membership || membership.role !== "MANAGER") {
            throw new Error("You do not have permission to manage tiers for this event");
        }

        await this.doorSaleTierRepository.delete(tierId);
    }
}
