import type { JobsOptions } from "bullmq";

export const ROBLOX_EXPERIENCE_NOTIFICATIONS_QUEUE = "roblox-experience-notifications";

export const DEFAULT_QUEUE_OPTIONS: JobsOptions = {
  removeOnComplete: {
    age: 10 * 24 * 3600, // 10 days
  },
  removeOnFail: {
    age: 10 * 24 * 3600, // 10 days
  },
};

export const QUEUES = {
  ROBLOX_EXPERIENCE_NOTIFICATIONS: "roblox-experience-notifications",
} as const;