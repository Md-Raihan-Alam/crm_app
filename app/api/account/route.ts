import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/authGuard";
import { getOwnCustomerRecord } from "@/lib/customerAccess";

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(["customer"]);

    const record = await getOwnCustomerRecord(user._id!);

    if (!record) {
      return NextResponse.json(
        { error: "No linked customer record found for this account." },
        { status: 404 }
      );
    }

    return NextResponse.json({ customer: record }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Get account error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
