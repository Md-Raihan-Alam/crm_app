import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/authGuard";
import { isOwnCustomerRecord } from "@/lib/customerAccess";
import { AuditLog } from "@/models/types";

function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: "Invalid customer id." },
        { status: 400 }
      );
    }

    const customerId = new ObjectId(id);

    if (user.role === "customer") {
      const owns = await isOwnCustomerRecord(user._id!, customerId);
      if (!owns) {
        return NextResponse.json(
          { error: "You do not have permission to view this timeline." },
          { status: 403 }
        );
      }
    }

    const db = await getDb();
    const logs = db.collection<AuditLog>("auditLogs");

    const entries = await logs
      .find({ customerId })
      .sort({ createdAt: -1 })
      .limit(50) // cap: a timeline doesn't need to render thousands of entries at once
      .toArray();

    return NextResponse.json({ entries }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Get timeline error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
