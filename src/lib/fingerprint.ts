import { createHash } from "crypto";
import { config } from "../config";

import type { Context } from "hono";

const ALL_FINGERPRINT_HEADERS = [
  // Browser headers
  "user-agent",
  "accept",
  "accept-language",
  "accept-encoding",

  // Roblox Server headers
  "roblox-id",

  // Client Hints (modern browsers)
  "sec-ch-ua",
  "sec-ch-ua-platform",
  "sec-ch-ua-platform-version",
  "sec-ch-ua-arch",

  // Network and connection info
  "x-forwarded-for",
  "x-real-ip",
  "cf-connecting-ip",
  "x-client-ip",

  // TLS/SSL fingerprinting indicators
  "x-forwarded-proto",
  "x-forwarded-ssl",

  // Viewport and device hints
  "viewport-width",
  "width",
  "device-memory",
  "rtt",
  "downlink",
  "ect",
];

/**
 * Enhanced fingerprint generation with multiple data sources
 * @param c Hono context
 * @returns A comprehensive hashed fingerprint string
 */
export function generateFingerprint(c: Context): string {
  const components = ALL_FINGERPRINT_HEADERS.map(header => c.req.header(header) ?? "unknown");
  const hash = createHash("sha256");
  hash.update(`${components.join("|")}-${config.fingerprint.salt}`);
  return hash.digest("hex");
}

/**
 * Analyzes fingerprint uniqueness and provides confidence score
 */
export function analyzeFingerprintQuality(c: Context): {
  confidence: number;
  entropy: number;
  components: number;
} {
  const components = ALL_FINGERPRINT_HEADERS.map(header => c.req.header(header) ?? "unknown");
  const availableComponents = components.length;

  // Calculate entropy based on the diversity of header values
  const entropy = calculateEntropy(components as string[]);

  // Calculate confidence score based on:
  // - Number of available components (more = better)
  // - Entropy of the data (higher = more unique)
  // - Presence of high-value headers (User-Agent, the Roblox ID, etc.)
  let confidence = 0;

  // Base confidence from component count (0-40 points)
  confidence += Math.min(availableComponents * 2, 40);

  // Entropy bonus (0-30 points)
  confidence += Math.min(entropy * 10, 30);

  // High-value header bonuses (0-30 points total)
  if (c.req.header("user-agent")) confidence += 8;
  if (c.req.header("sec-ch-ua")) confidence += 6;
  if (c.req.header("accept-language")) confidence += 4;
  if (c.req.header("roblox-id")) confidence += 8; // Roblox-specific, very valuable
  if (c.req.header("x-forwarded-for") || c.req.header("cf-connecting-ip")) confidence += 4;

  confidence = Math.min(confidence, 100); // Normalize

  return {
    confidence: Math.round(confidence * 100) / 100,
    entropy: Math.round(entropy * 100) / 100,
    components: availableComponents,
  };
}

/**
 * Calculate Shannon entropy for a set of strings
 */
function calculateEntropy(values: string[]): number {
  if (values.length === 0) return 0;

  // We count the frequency of each unique value
  const frequencies = new Map<string, number>();
  for (const value of values) {
    frequencies.set(value, (frequencies.get(value) || 0) + 1);
  }

  // Calculate da entropy
  let entropy = 0;
  const total = values.length;

  for (const count of frequencies.values()) {
    const probability = count / total;
    if (probability > 0) {
      entropy -= probability * Math.log2(probability);
    }
  }

  return entropy;
}