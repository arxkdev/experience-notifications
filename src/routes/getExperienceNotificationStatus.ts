import { RobloxExperienceNotificationsService } from "~/services/roblox-experience-service";

import type { Context } from "hono";

export default async function getExperienceNotificationStatus(c: Context) {
  const jobId = c.req.query("jobId");
  if (!jobId) {
    return c.json({ message: "Job ID is required", status: 400 });
  }

  const status = await RobloxExperienceNotificationsService.getRobloxExperienceNotificationStatus(jobId);

  if (!status) {
    return c.json({ message: "Experience notification status not found", status: 404 });
  }

  // We will return the status without the apiKey
  const returningStatus = {
    userId: status.message.body.userId,
    universeId: status.message.body.universeId,
    assetId: status.message.body.assetId,
    status: status.status,
  };

  if (!status) {
    return c.json({ message: "Experience notification status not found", status: 404 });
  }

  return c.json({ message: "Experience notification status", data: returningStatus, status: 200 });
}