import { z } from "zod";

export const experienceNotificationSchema = z.object({
  userId: z.string(),
  universeId: z.string(),
  assetId: z.string(),
  delayTimestamp: z.string().optional(), // Can be a date or a timestamp (2025-01-01T00:00:00.000Z or 1716460800000)
});

export const cancelExperienceNotificationSchema = z.object({
  jobId: z.string(),
});