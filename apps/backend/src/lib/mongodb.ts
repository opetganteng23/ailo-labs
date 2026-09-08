import dns from "node:dns";

import mongoose from "mongoose";

import { getEnv, requireMongoUri } from "@/lib/env";

// Some local/sandboxed DNS resolvers refuse SRV queries, which
// mongodb+srv:// connection strings depend on. Fall back to a public
// resolver so `mongodb+srv://` URIs (e.g. MongoDB Atlas) still resolve.
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // ignore — non-fatal, connection will simply fail with the OS resolver
}

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
