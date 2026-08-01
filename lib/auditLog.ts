import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { AuditLog } from "@/models/types";

type LogActionParams = {
  userId: ObjectId;
  action: string;
  targetId?: ObjectId;
  details?: string;
};

/**
 * Records an audit log entry. Deliberately never throws — a logging
 * failure must never block or fail the real operation it's describing.
 */
export async function logAction({
  userId,
  action,
  targetId,
  details,
}: LogActionParams): Promise<void> {
  try {
    const db = await getDb();
    const logs = db.collection<AuditLog>("auditLogs");

    const entry: AuditLog = {
      userId,
      action,
      targetId,
      details,
      createdAt: new Date(),
    };

    await logs.insertOne(entry);
  } catch (error) {
    // Intentionally swallowed: logging must never break the calling operation.
    console.error("Failed to write audit log:", error);
  }
}
