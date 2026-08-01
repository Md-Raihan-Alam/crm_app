import { ObjectId } from "mongodb";

// A registered user of the system — either an Admin or a Customer.
export interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: "admin" | "customer";
  createdAt: Date;
  updatedAt: Date;
}

// A customer record managed by the Admin.
// Note: a Customer *user* (login) may or may not be linked to a Customer *record* —
// we'll connect these in the Customer Management phase.
export interface Customer {
  _id?: ObjectId;
  userId?: ObjectId; // links to a User with role "customer", if they have login access
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: "lead" | "active" | "inactive";
  createdBy: ObjectId; // the Admin user who created this record
  createdAt: Date;
  updatedAt: Date;
}

// A note attached to a customer.
export interface Note {
  _id?: ObjectId;
  customerId: ObjectId;
  authorId: ObjectId; // the User who wrote it
  content: string;
  visibleToCustomer: boolean; // whether the linked customer can see this note
  createdAt: Date;
}

// A task related to a customer.
export interface Task {
  _id?: ObjectId;
  customerId: ObjectId;
  assignedTo: ObjectId; // User this task is for
  title: string;
  description?: string;
  status: "pending" | "in-progress" | "completed";
  dueDate?: Date;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// An audit log entry — records who did what, for accountability.
export interface AuditLog {
  _id?: ObjectId;
  userId: ObjectId;
  action: string; // e.g. "customer.created", "customer.deleted"
  targetId?: ObjectId;
  details?: string;
  createdAt: Date;
}
