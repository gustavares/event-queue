import * as argon2 from 'argon2';

// Recommended options (can be tuned based on server capabilities and security needs)
// OWASP recommends: memory >= 19 MiB (argon2.MemoryCost.MiB = 1024), iterations >= 2, parallelism = 1
// Argon2 default for 'type: argon2.argon2id' is often reasonable too.
// Let's start with something balanced:
const HASH_OPTIONS: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 65536 KiB = 64 MiB
    timeCost: 3,         // Number of iterations
    parallelism: 1,      // Number of threads
    // saltLength: 16, // Default is 16 bytes, usually fine
    // hashLength: 32, // Default is 32 bytes, usually fine
};

export async function hashPassword(password: string): Promise<string> {
    try {
        return await argon2.hash(password, HASH_OPTIONS);
    } catch (err) {
        console.error("Error hashing password:", err);
        // TODO: Implement proper error handling/logging for production
        throw new Error("Could not hash password.");
    }
}

export async function verifyPassword(hash: string, plainTextPassword: string): Promise<boolean> {
    try {
        return await argon2.verify(hash, plainTextPassword);
    } catch (err) {
        return false;
    }
}
