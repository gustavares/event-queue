import { z } from "zod";
import { ValidationError } from "../common/errors";
import { SubscriberRepository } from "../../repositories/subscriber.repository";
import { CityRepository } from "../../repositories/city.repository";

const schema = z.object({
    email: z.string().trim().email("Enter a valid email address."),
    citySlug: z.string().min(1),
});

export interface SubscribeInput {
    email: string;
    citySlug: string;
}

/**
 * Newsletter capture (BR-SUB-001..005).
 *
 * Capture only — nothing here sends email. The unsubscribe token is generated at capture
 * time anyway, because LGPD compliance is far cheaper to build in now than to retrofit
 * onto a list that already exists.
 */
export default class SubscribeService {
    constructor(
        private readonly subscriberRepository: SubscriberRepository,
        private readonly cityRepository: CityRepository
    ) {}

    async run(input: SubscribeInput): Promise<{ email: string; cityName: string }> {
        const parsed = schema.safeParse(input);
        if (!parsed.success) {
            throw ValidationError(parsed.error.issues[0].message);
        }

        const city = await this.cityRepository.findBySlug(parsed.data.citySlug);
        if (!city) {
            throw ValidationError("We don't cover that city yet.");
        }

        // BR-SUB-002 — idempotent at the repository, so subscribing twice is a no-op
        // rather than an error the visitor has to understand.
        const subscriber = await this.subscriberRepository.subscribe({
            email: parsed.data.email,
            cityId: city.id,
        });

        return { email: subscriber.email, cityName: city.name };
    }
}
