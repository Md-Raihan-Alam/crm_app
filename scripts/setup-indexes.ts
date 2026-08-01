import { getDb } from "@/lib/db";

async function setupIndexes() {
  const db = await getDb();

  await db.collection("users").createIndex({ email: 1 }, { unique: true });

  await db.collection("sessions").createIndex({ token: 1 }, { unique: true });
  await db
    .collection("sessions")
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  await db.collection("customers").createIndex({ email: 1 }, { unique: true });
  await db.collection("customers").createIndex({ name: 1 });
  await db.collection("customers").createIndex({ status: 1 });

  await db.collection("notes").createIndex({ customerId: 1 });
  await db.collection("tasks").createIndex({ customerId: 1 });
  await db.collection("tasks").createIndex({ assignedTo: 1 });

  // Timeline queries filter by customerId and sort by createdAt — a
  // compound index supports both parts of that query efficiently.
  await db
    .collection("auditLogs")
    .createIndex({ customerId: 1, createdAt: -1 });

  console.log("Indexes created successfully.");
  process.exit(0);
}

setupIndexes().catch((err) => {
  console.error("Failed to set up indexes:", err);
  process.exit(1);
});
