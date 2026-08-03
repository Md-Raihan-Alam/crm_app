import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  verifyPassword,
  generateSessionToken,
  getSessionExpiry,
} from "@/lib/auth";
import { User, Session } from "@/models/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, rememberMe } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const users = db.collection<User>("users");
    const sessions = db.collection<Session>("sessions");

    const normalizedEmail = email.trim().toLowerCase();
    const user = await users.findOne({ email: normalizedEmail });

    // Generic error whether the email doesn't exist or the password is wrong —
    // prevents attackers from figuring out which emails are registered.
    const GENERIC_ERROR = "Invalid email or password.";

    if (!user) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    // "Remember me" extends session length from 1 day to 30 days.
    const expiryDays = rememberMe ? 30 : 1;
    const token = generateSessionToken();
    const expiresAt = getSessionExpiry(expiryDays);

    await sessions.insertOne({
      userId: user._id!,
      token,
      expiresAt,
      createdAt: new Date(),
    });

    // Never send passwordHash back to the client.
    const { passwordHash, ...safeUser } = user;

    const response = NextResponse.json(
      { message: "Login successful.", user: safeUser },
      { status: 200 }
    );

    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
