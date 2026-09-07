import mongoose from "mongoose";

import { getEnv, requireMongoUri } from "@/lib/env";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = cached;

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const options = {
      dbName: getEnv().MONGODB_DB_NAME,
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(requireMongoUri(), options);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
