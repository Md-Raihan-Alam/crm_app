import { getCurrentUser, SafeUser } from "@/lib/session";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Ensures a user is logged in. Throws AuthError(401) if not.
 * Returns the current user for convenience.
 */
export async function requireAuth(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("Authentication required.", 401);
  }
  return user;
}

/**
 * Ensures a user is logged in AND has one of the allowed roles.
 * Throws AuthError(401) if not logged in, AuthError(403) if wrong role.
 */
export async function requireRole(
  allowedRoles: Array<"admin" | "customer">
): Promise<SafeUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new AuthError(
      "You do not have permission to perform this action.",
      403
    );
  }
  return user;
}
