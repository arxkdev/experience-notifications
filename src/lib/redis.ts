import IORedis from "ioredis";
import { config } from "../config";

export let connection: IORedis | null = null;

export const getRedis = () => {
  if (!connection) {
    connection = new IORedis(config.redis.url, {
      maxRetriesPerRequest: null,
    });
  }
  return connection;
};
