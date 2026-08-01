import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/authGuard";
import { Customer } from "@/models/types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole(["admin"]);

    const body = await req.json();
    const { name, email, phone, company, status } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Customer name must be at least 2 characters." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "A valid email is required." },
        { status: 400 }
      );
    }

    const allowedStatuses = ["lead", "active", "inactive"];
    const finalStatus = allowedStatuses.includes(status) ? status : "lead";

    const db = await getDb();
    const customers = db.collection<Customer>("customers");

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await customers.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json(
        { error: "A customer with this email already exists." },
        { status: 409 }
      );
    }

    const now = new Date();
    const newCustomer: Customer = {
      name: name.trim(),
      email: normalizedEmail,
      phone: typeof phone === "string" ? phone.trim() : undefined,
      company: typeof company === "string" ? company.trim() : undefined,
      status: finalStatus,
      createdBy: admin._id!, // server-derived, never from request body
      createdAt: now,
      updatedAt: now,
    };

    const result = await customers.insertOne(newCustomer);

    return NextResponse.json(
      {
        message: "Customer created.",
        customer: { ...newCustomer, _id: result.insertedId },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Create customer error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireRole(["admin"]);

    const { searchParams } = new URL(req.url);

    let page = parseInt(searchParams.get("page") || "1", 10);
    let limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search")?.trim() || "";

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100;

    const db = await getDb();
    const customers = db.collection<Customer>("customers");

    // Escape regex special characters so search input can't break out of
    // the intended pattern or cause pathological matching.
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const filter = search
      ? {
          $or: [
            { name: { $regex: escapedSearch, $options: "i" } },
            { email: { $regex: escapedSearch, $options: "i" } },
            { company: { $regex: escapedSearch, $options: "i" } },
          ],
        }
      : {};

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      customers
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      customers.countDocuments(filter),
    ]);

    return NextResponse.json(
      {
        customers: items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("List customers error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
