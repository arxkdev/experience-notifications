import { gunzip } from "zlib";
import { promisify } from "util";
import type { Context, Next } from "hono";

const gunzipAsync = promisify(gunzip);

/**
 * Parse the request body as a JSON object
 * @param c - The context object
 * @param next - The next middleware function
 */
export async function parseGzippedJson(c: Context, next: Next) {
  const contentType = c.req.header("content-type")?.toLowerCase();
  const contentEncoding = c.req.header("content-encoding")?.toLowerCase();

  if (contentType?.startsWith("application/json") && contentEncoding === "gzip") {
    try {
      const buffer = await c.req.arrayBuffer();
      const decompressed = await gunzipAsync(Buffer.from(buffer));
      const jsonString = decompressed.toString("utf-8");
      const parsedJson = JSON.parse(jsonString);

      c.req.json = () => Promise.resolve(parsedJson);
    } catch (error) {
      console.error("Failed to parse gzipped JSON:", error);
      c.status(400);

      const errorMessage = error instanceof SyntaxError
        ? "Invalid JSON format in gzipped content"
        : "Failed to decompress gzipped content";

      return c.json({ error: errorMessage });
    }
  }

  await next();
}