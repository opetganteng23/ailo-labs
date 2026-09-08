import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().url().optional(),
  MONGODB_DB_NAME: z.string().default("ailo"),
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  CORS_ORIGIN: z.string().url().optional(),
  APP_EMAIL: z.string().optional(),
  APP_PASSWORD: z.string().optional(),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
});

export function getEnv() {
  return envSchema.parse({
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    APP_EMAIL: process.env.APP_EMAIL,
    APP_PASSWORD: process.env.APP_PASSWORD,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  });
}

export function requireMongoUri() {
  const { MONGODB_URI } = getEnv();

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is required for database operations.");
  }

  return MONGODB_URI;
}
