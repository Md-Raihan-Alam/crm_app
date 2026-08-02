import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/authGuard";
import { logAction } from "@/lib/auditLog";
import { User } from "@/models/types";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const users = db.collection<User>("users");

    const result = await users.findOneAndUpdate(
      { _id: user._id },
      { $set: { name: name.trim(), updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await logAction({
      userId: user._id!,
      action: "profile.updated",
      targetId: user._id!,
      details: "Updated display name",
    });

    const { passwordHash, ...safeUser } = result;

    return NextResponse.json(
      { message: "Profile updated.", user: safeUser },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
