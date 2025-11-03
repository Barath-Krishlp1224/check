import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/adminpanel"; // add your DB name here

if (!MONGODB_URI) {
  throw new Error("❌ Please define MONGODB_URI in environment variables");
}

// Create a global cached connection (for Next.js hot reload)
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, { bufferCommands: false })
      .then((mongooseInstance) => {
        console.log("✅ MongoDB connected successfully");
        return mongooseInstance;
      })
      .catch((err) => {
        console.error("❌ MongoDB connection failed:", err);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;