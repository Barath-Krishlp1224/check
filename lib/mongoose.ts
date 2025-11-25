// lib/mongoose.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable in .env");
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var __mongoose: any;
}

let cached = (global as any).__mongoose;

if (!cached) {
  cached = (global as any).__mongoose = { conn: null as any, promise: null as any };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI)
      .then((m) => m)
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
