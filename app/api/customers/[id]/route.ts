import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/authGuard";
import { logAction } from "@/lib/auditLog";
import { Customer } from "@/models/types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(["admin"]);

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: "Invalid customer id." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const customers = db.collection<Customer>("customers");
    const customer = await customers.findOne({ _id: new ObjectId(id) });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ customer }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Get customer error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireRole(["admin"]);

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: "Invalid customer id." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const updates: Partial<Customer> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length < 2) {
        return NextResponse.json(
          { error: "Customer name must be at least 2 characters." },
          { status: 400 }
        );
      }
      updates.name = body.name.trim();
    }

    if (body.email !== undefined) {
      if (typeof body.email !== "string" || !EMAIL_REGEX.test(body.email)) {
        return NextResponse.json(
          { error: "A valid email is required." },
          { status: 400 }
        );
      }
      updates.email = body.email.trim().toLowerCase();
    }

    if (body.phone !== undefined) {
      updates.phone =
        typeof body.phone === "string" ? body.phone.trim() : undefined;
    }

    if (body.company !== undefined) {
      updates.company =
        typeof body.company === "string" ? body.company.trim() : undefined;
    }

    if (body.status !== undefined) {
      const allowedStatuses = ["lead", "active", "inactive"];
      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: "Status must be lead, active, or inactive." },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided to update." },
        { status: 400 }
      );
    }

    updates.updatedAt = new Date();

    const db = await getDb();
    const customers = db.collection<Customer>("customers");

    if (updates.email) {
      const existing = await customers.findOne({
        email: updates.email,
        _id: { $ne: new ObjectId(id) },
      });
      if (existing) {
        return NextResponse.json(
          { error: "A customer with this email already exists." },
          { status: 409 }
        );
      }
    }

    const result = await customers.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { error: "Customer not found." },
        { status: 404 }
      );
    }

    await logAction({
      userId: admin._id!,
      action: "customer.updated",
      targetId: new ObjectId(id),
      customerId: new ObjectId(id),
      details: `Updated fields: ${Object.keys(updates)
        .filter((k) => k !== "updatedAt")
        .join(", ")}`,
    });

    return NextResponse.json(
      { message: "Customer updated.", customer: result },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Update customer error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireRole(["admin"]);

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: "Invalid customer id." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const customers = db.collection<Customer>("customers");

    // Fetch before deleting so we can log a meaningful name, not just an id.
    const customerToDelete = await customers.findOne({ _id: new ObjectId(id) });

    const result = await customers.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Customer not found." },
        { status: 404 }
      );
    }

    await logAction({
      userId: admin._id!,
      action: "customer.deleted",
      targetId: new ObjectId(id),
      customerId: new ObjectId(id),
      details: customerToDelete
        ? `Deleted customer "${customerToDelete.name}"`
        : undefined,
    });

    return NextResponse.json({ message: "Customer deleted." }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Delete customer error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
