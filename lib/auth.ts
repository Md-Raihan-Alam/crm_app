import bcrypt from "bcryptjs";
import crypto from "crypto";

const SALT_ROUNDS = parseInt(process.env.SALT_ROUND || "10", 10);

const PEPPER = process.env.PASSWORD_PEPPER;

if (!PEPPER) {
  throw new Error(
    "Missing PASSWORD_PEPPER environment variable. Add it to .env.local"
  );
}

/**
 * Mixes in a server-side secret (the "pepper") before bcrypt ever sees the
 * password. Unlike bcrypt's own per-password salt (stored alongside the
 * hash, in the DB), the pepper lives only in the environment — so even a
 * full database leak isn't enough to brute-force passwords offline without
 * also having this secret.
 */
function applyPepper(plainPassword: string): string {
  return crypto
    .createHmac("sha256", PEPPER!)
    .update(plainPassword)
    .digest("hex");
}

/**
 * Hashes a plaintext password for storage.
 * Never store the plaintext password anywhere — only this hash.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(applyPepper(plainPassword), SALT_ROUNDS);
}

/**
 * Compares a plaintext password (from a login form) against a stored hash.
 * Returns true if they match.
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(applyPepper(plainPassword), hashedPassword);
}

/**
 * Generates a cryptographically secure random session token.
 * This is what gets stored in the cookie and in the database.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Returns an expiry Date a fixed number of days from now.
 * Used to set session/cookie expiration.
 */
export function getSessionExpiry(days: number = 7): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}
