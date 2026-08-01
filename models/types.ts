import { ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: "admin" | "customer";
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  _id?: ObjectId;
  userId?: ObjectId;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: "lead" | "active" | "inactive";
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  _id?: ObjectId;
  customerId: ObjectId;
  authorId: ObjectId;
  content: string;
  visibleToCustomer: boolean;
  createdAt: Date;
}

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

export interface AuditLog {
  _id?: ObjectId;
  userId: ObjectId;
  action: string;
  targetId?: ObjectId;
  customerId?: ObjectId; // denormalized for fast per-customer timeline queries
  details?: string;
  createdAt: Date;
}

export interface Session {
  _id?: ObjectId;
  userId: ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}
