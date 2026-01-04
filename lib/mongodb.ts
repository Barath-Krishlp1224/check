// lib/mongodb.ts
import mongoose, { Mongoose } from "mongoose";

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/Lemonpay_Portal";

if (!MONGODB_URI) {
  throw new Error("Missing environment variable: MONGODB_URI");
}

let cached = global as typeof global & {
  _mongooseCache: MongooseCache;
};

if (!cached._mongooseCache) {
  cached._mongooseCache = { conn: null, promise: null };
}

export async function connectDB() {
  const cache = cached._mongooseCache;

  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    const opts = {
      bufferCommands: false,
      dbName: process.env.DB_NAME || "Lemonpay_Portal",
    };

    cache.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log("MongoDB Connected");
        return mongooseInstance;
      })
      .catch((err) => {
        console.error("MongoDB Connection Error:", err);
        cache.promise = null; 
        throw err;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

export default connectDB;