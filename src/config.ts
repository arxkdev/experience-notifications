import * as dotenv from "dotenv";
dotenv.config();

// Export all environment variables with type safety
export const config = {
  redis: {
    url: process.env.REDIS_URL || "",
  },
  cloudflare: {
    devAccessId: process.env.CF_DEV_ACCESS_ID || "",
    devAccessSecret: process.env.CF_DEV_ACCESS_SECRET || "",
  },
  auth: {
    accessToken: process.env.ACCESS_TOKEN || "",
  },
  misc: {
    NODE_ENV: process.env.NODE_ENV || "development",
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY || "",
  }
} as const;

export type Config = typeof config;
