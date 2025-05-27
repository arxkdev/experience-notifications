import { config } from "@/config";
import { createMiddleware } from "hono/factory";

/**
 * Authentication middleware
 * @param c - The context object
 * @param next - The next middleware function
 */
export const authMiddleware = createMiddleware(async (c, next) => {
  // Ignore "/" or if the environment is development
  if (c.req.path === "/" || config.misc.NODE_ENV === "development") {
    return next();
  }

  const apiKey = c.req.header("Authorization");

  if (!apiKey) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (!apiKey.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (apiKey !== `Bearer ${config.auth.accessToken}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return next();
});