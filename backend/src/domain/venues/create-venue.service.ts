import { z } from "zod";
import { VenueRepository } from "../../repositories/venue.repository";
import { VenueEntity } from "../../repositories/venue.entity";

export type CreateVenueData = {
    name: string;
    address: string;
    capacity?: number;
    userId: string;
};

const CreateVenueSchema = z.object({
    name: z.string().min(1, "Name is required"),
    address: z.string().min(1, "Address is required"),
    capacity: z.number().int().positive("Capacity must be a positive integer").optional(),
    userId: z.string().min(1, "User ID is required"),
});

export default class CreateVenueService {
    constructor(
        private venueRepository: VenueRepository
    ) { }

    async run(inputData: CreateVenueData): Promise<VenueEntity> {
        const validationResult = CreateVenueSchema.safeParse(inputData);
        if (!validationResult.success) {
            const validationErrors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
            throw new Error(`Input validation failed: ${validationErrors.join('; ')}`);
        }

        const { name, address, capacity, userId } = validationResult.data;

        return this.venueRepository.create({
            name,
            address,
            capacity,
            createdBy: userId,
        });
    }
}
