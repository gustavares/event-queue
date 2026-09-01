import { VenueEntity } from "../../repositories/venue.entity";
import { VenueRepository } from "../../repositories/venue.repository";

/**
 * Reads for the Venue aggregate.
 *
 * Exists so handlers and type resolvers never reach a repository directly
 * (docs/patterns.md § The layering rule). Venue reads are unrestricted today per
 * BR-VEN-001, but routing them through a service means the one place to add a
 * restriction later is obvious — and Public Discovery will add city scoping here.
 */
export default class GetVenuesService {
    constructor(private readonly venueRepository: VenueRepository) {}

    async listAll(): Promise<VenueEntity[]> {
        return this.venueRepository.findAll();
    }

    async getById(id: string): Promise<VenueEntity | null> {
        return this.venueRepository.findById(id);
    }
}
