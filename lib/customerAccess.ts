import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { Customer } from "@/models/types";

/**
 * Checks whether the given userId is the linked customer for the given
 * customerId. Used to enforce that a "customer" role user can only access
 * their own customer record's data.
 */
export async function isOwnCustomerRecord(
  userId: ObjectId,
  customerId: ObjectId
): Promise<boolean> {
  const db = await getDb();
  const customers = db.collection<Customer>("customers");

  const record = await customers.findOne({
    _id: customerId,
    userId: userId,
  });

  return record !== null;
}

/**
 * Returns the Customer record linked to the given userId, or null if this
 * user has no linked customer record (e.g., an Admin, or an unlinked account).
 */
export async function getOwnCustomerRecord(
  userId: ObjectId
): Promise<Customer | null> {
  const db = await getDb();
  const customers = db.collection<Customer>("customers");

  return customers.findOne({ userId });
}
