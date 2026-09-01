import { ValidationError } from "../../common/errors";
import { EventExtractor, ExtractedEvent } from "./event-extractor";

/**
 * The extractor used when no ANTHROPIC_API_KEY is configured.
 *
 * It throws the spec's own "couldn't read that page" copy, which the curator UI already
 * handles by falling through to the blank manual form. So an environment without a key
 * degrades to manual entry rather than breaking — which is also exactly the behaviour the
 * spec defines for an unreachable page, so there is no second code path to maintain.
 */
export default class UnavailableExtractor implements EventExtractor {
    async extract(_sourceUrl: string): Promise<ExtractedEvent> {
        throw ValidationError("We couldn't read that page. Enter the details manually.");
    }
}
