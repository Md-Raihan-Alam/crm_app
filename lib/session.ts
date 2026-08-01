import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { Session, User } from "@/models/types";
import { ObjectId } from "mongodb";

// The shape we return to callers — never includes passwordHash.
export type SafeUser = Omit<User, "passwordHash">;

/**
 * Reads the session cookie, validates it against the database,
 * and returns the current user — or null if not logged in / session invalid.
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (!token) {
    return null;
  }

  const db = await getDb();
  const sessions = db.collection<Session>("sessions");
  const users = db.collection<User>("users");

  const session = await sessions.findOne({ token });

  if (!session) {
    return null;
  }

  if (session.expiresAt < new Date()) {
    // Expired — clean it up so it doesn't linger in the DB.
    await sessions.deleteOne({ _id: session._id });
    return null;
  }

  const user = await users.findOne({ _id: session.userId });

  if (!user) {
    // Edge case: user was deleted but their session wasn't cleaned up.
    return null;
  }

  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

/**
 * Deletes a session from the database by its token.
 * Used by the logout route.
 */
export async function destroySession(token: string): Promise<void> {
  const db = await getDb();
  const sessions = db.collection<Session>("sessions");
  await sessions.deleteOne({ token });
}
