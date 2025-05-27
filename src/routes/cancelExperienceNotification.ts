import { RobloxExperienceNotificationsService } from "~/services/roblox-experience-service";
import { cancelExperienceNotificationSchema } from "~/validations/experience-notification";

import type { Context } from "hono";

export default async function cancelExperienceNotification(c: Context) {
  let body;
  try {
    body = await c.req.json();
  } catch (e) {
    console.error(e);
    return c.json({ message: "Invalid JSON in request body", status: 400 });
  }

  if (!body) {
    return c.json({ message: "Empty request body", status: 400 });
  }

  const validatedBody = cancelExperienceNotificationSchema.safeParse(body);
  if (!validatedBody.success) {
    return c.json({ message: validatedBody.error.errors, status: 400 });
  }

  const { jobId } = validatedBody.data;
  const cancelled = await RobloxExperienceNotificationsService.cancelJob(jobId);

  if (!cancelled) {
    return c.json({ message: "Failed to cancel experience notification", status: 500 });
  }

  return c.json({ message: "Experience notification cancelled", status: 200 });
}