import mongoose, { Mongoose } from "mongoose";

// Define the interface for the cached connection object
interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/employeetasks";

if (!MONGODB_URI) {
  throw new Error("❌ Missing environment variable: MONGODB_URI");
}

// 🐛 FIX: Cast global object to contain the MongooseCache type
let cached = global as typeof global & {
  _mongooseCache: MongooseCache;
};

// Initialize the cache object globally if it doesn't exist
if (!cached._mongooseCache) {
  cached._mongooseCache = { conn: null, promise: null };
}

export async function connectDB() {
  const cache = cached._mongooseCache;

  // 1. Return cached connection if available
  if (cache.conn) {
    return cache.conn;
  }

  // 2. If a connection promise is not yet running, create one
  if (!cache.promise) {
    const opts = {
      bufferCommands: false,
      dbName: process.env.DB_NAME || "employeetasks",
    };

    cache.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log("✅ MongoDB Connected");
        return mongooseInstance;
      })
      .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err);
        // Reset promise on error so the next attempt can try again
        cache.promise = null; 
        throw err;
      });
  }

  // 3. Wait for the promise and cache the connection
  cache.conn = await cache.promise;
  return cache.conn;
}

export default connectDB;