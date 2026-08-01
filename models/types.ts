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
  authorId: ObjectId;
  content: string;
  visibleToCustomer: boolean;
  createdAt: Date;
}

// A task related to a customer.
export interface Task {
  _id?: ObjectId;
  customerId: ObjectId;
  assignedTo: ObjectId;
  title: string;
  description?: string;
  status: "pending" | "in-progress" | "completed";
  dueDate?: Date;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// An audit log entry.
export interface AuditLog {
  _id?: ObjectId;
  userId: ObjectId;
  action: string;
  targetId?: ObjectId;
  details?: string;
  createdAt: Date;
}

// A server-side session record, backing the httpOnly session cookie.
export interface Session {
  _id?: ObjectId;
  userId: ObjectId;
  token: string; // matches the value stored in the cookie
  expiresAt: Date;
  createdAt: Date;
}
