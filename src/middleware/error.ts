import type { Context } from "hono";

/**
 * Error handler middleware
 * @param err - The error object
 * @param c - The context object
 */
export const errorHandler = (err: Error, c: Context) => {
  console.error(err);
  return c.json({ error: "Internal Server Error" }, 500);
};