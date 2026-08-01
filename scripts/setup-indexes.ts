import { getDb } from "@/lib/db";

async function setupIndexes() {
  const db = await getDb();

  // Users: email must be unique — this is the DB-level backstop for the
  // application-level check we already do in the register route.
  await db.collection("users").createIndex({ email: 1 }, { unique: true });

  // Sessions: token lookups happen on every authenticated request (via
  // getCurrentUser), so this needs to be fast. Also index expiresAt so
  // MongoDB can auto-expire old sessions via a TTL index.
  await db.collection("sessions").createIndex({ token: 1 }, { unique: true });
  await db.collection("sessions").createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 } // TTL index: MongoDB deletes docs once expiresAt is in the past
  );

  // Customers: email should be unique among customers, and we'll frequently
  // filter/search by name, email, and status.
  await db.collection("customers").createIndex({ email: 1 }, { unique: true });
  await db.collection("customers").createIndex({ name: 1 });
  await db.collection("customers").createIndex({ status: 1 });

  // Notes & Tasks: always queried by customerId ("show all notes/tasks for
  // this customer"), so that's the field that needs indexing.
  await db.collection("notes").createIndex({ customerId: 1 });
  await db.collection("tasks").createIndex({ customerId: 1 });
  await db.collection("tasks").createIndex({ assignedTo: 1 });

  console.log("Indexes created successfully.");
  process.exit(0);
}

setupIndexes().catch((err) => {
  console.error("Failed to set up indexes:", err);
  process.exit(1);
});
