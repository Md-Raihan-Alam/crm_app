import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/authGuard";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { logAction } from "@/lib/auditLog";
import { User, Session } from "@/models/types";

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || typeof currentPassword !== "string") {
      return NextResponse.json(
        { error: "Current password is required." },
        { status: 400 }
      );
    }

    if (
      !newPassword ||
      typeof newPassword !== "string" ||
      newPassword.length < 8
    ) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const users = db.collection<User>("users");

    // Fetch the full user document (including passwordHash) — requireAuth()
    // returns a SafeUser with the hash stripped, so we need a fresh lookup here.
    const fullUser = await users.findOne({ _id: user._id });
    if (!fullUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const isCorrect = await verifyPassword(
      currentPassword,
      fullUser.passwordHash
    );
    if (!isCorrect) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 401 }
      );
    }

    const newHash = await hashPassword(newPassword);

    await users.updateOne(
      { _id: user._id },
      { $set: { passwordHash: newHash, updatedAt: new Date() } }
    );

    // Invalidate all other sessions for this user — keep only the current one.
    const currentToken = req.cookies.get("session_token")?.value;
    const sessions = db.collection<Session>("sessions");
    await sessions.deleteMany({
      userId: user._id,
      token: { $ne: currentToken },
    });

    await logAction({
      userId: user._id!,
      action: "profile.password_changed",
      targetId: user._id!,
    });

    return NextResponse.json(
      { message: "Password changed successfully." },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
