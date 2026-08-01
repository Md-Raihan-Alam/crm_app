import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("session_token")?.value;

    if (token) {
      await destroySession(token);
    }

    const response = NextResponse.json(
      { message: "Logged out successfully." },
      { status: 200 }
    );

    // Clear the cookie by setting it with an already-past expiry date.
    response.cookies.set("session_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
