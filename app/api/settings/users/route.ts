import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/authGuard";
import { hashPassword } from "@/lib/auth";
import { logAction } from "@/lib/auditLog";
import { User, Customer } from "@/models/types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}

export async function GET(req: NextRequest) {
  try {
    await requireRole(["admin"]);

    const db = await getDb();
    const users = db.collection<User>("users");

    // Exclude passwordHash at the query level using a projection —
    // never fetch it at all for a list view that doesn't need it.
    const items = await users
      .find({}, { projection: { passwordHash: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ users: items }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("List users error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole(["admin"]);

    const body = await req.json();
    const { customerId, email, password } = body;

    if (
      !customerId ||
      typeof customerId !== "string" ||
      !isValidObjectId(customerId)
    ) {
      return NextResponse.json(
        { error: "A valid customer is required." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "A valid email is required." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const customers = db.collection<Customer>("customers");
    const users = db.collection<User>("users");

    const customer = await customers.findOne({ _id: new ObjectId(customerId) });
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found." },
        { status: 404 }
      );
    }

    if (customer.userId) {
      return NextResponse.json(
        { error: "This customer already has a linked login." },
        { status: 409 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await users.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const now = new Date();

    const newUser: User = {
      name: customer.name, // seed with the customer's name; they can change it later via Profile
      email: normalizedEmail,
      passwordHash,
      role: "customer",
      createdAt: now,
      updatedAt: now,
    };

    const result = await users.insertOne(newUser);

    await customers.updateOne(
      { _id: customer._id },
      { $set: { userId: result.insertedId, updatedAt: now } }
    );

    await logAction({
      userId: admin._id!,
      action: "user.created",
      targetId: result.insertedId,
      customerId: customer._id,
      details: `Created customer login for "${customer.name}"`,
    });

    return NextResponse.json(
      { message: "Customer login created.", userId: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
