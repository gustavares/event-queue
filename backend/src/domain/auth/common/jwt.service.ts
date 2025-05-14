import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import dotenv from 'dotenv';

// TODO: refactor module to receive a config object as dependency
dotenv.config();

const JWT_SECRET_STRING = process.env.JWT_SECRET;

if (!JWT_SECRET_STRING) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
    process.exit(1); // TODO: throw error for app init
}

const secretKey = new TextEncoder().encode(JWT_SECRET_STRING);

export interface UserJWTPayload extends JWTPayload {
    userId: string;
    email: string;
}

const ISSUER = process.env.JWT_ISSUER || 'event-queue-app';
const AUDIENCE = process.env.JWT_AUDIENCE || 'event-queue-users';

/**
 * Creates a signed JWT for a given user payload.
 * @param payload - The user-specific data to include in the token.
 * @param expiresIn - Token expiration time (e.g., '2h', '7d'). Defaults to '1h'.
 * @returns A promise that resolves to the signed JWT string.
 */
export async function generateToken(
    payload: Omit<UserJWTPayload, keyof JWTPayload>,
    expiresIn: string = '1h'
): Promise<string> {
    try {
        const jwt = await new SignJWT(payload)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setIssuer(ISSUER)
            .setAudience(AUDIENCE)
            .setExpirationTime(expiresIn)
            .sign(secretKey);

        return jwt;
    } catch (error) {
        console.error("Error generating JWT:", error);
        throw new Error("Could not generate authentication token.");
    }
}

/**
 * Verifies a JWT and returns its payload if valid.
 * @param token - The JWT string to verify.
 * @returns A promise that resolves to the UserJWTPayload if the token is valid.
 * @throws If the token is invalid or verification fails.
 */
export async function verifyToken(token: string): Promise<UserJWTPayload> {
    try {
        const { payload } = await jwtVerify(token, secretKey, {
            issuer: ISSUER,
            audience: AUDIENCE,
            algorithms: ['HS256'],
        });
        return payload as UserJWTPayload;
    } catch (error) {
        console.error("Error verifying JWT:", error);
        // TODO: differentiate errors (e.g., expired, invalid signature)
        throw new Error("Invalid or expired authentication token.");
    }
}
