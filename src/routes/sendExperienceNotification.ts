import { RobloxExperienceNotificationsService } from "~/services/roblox-experience-service";
import { experienceNotificationSchema } from "~/validations/experience-notification";
import Encryption from "~/crypto/encryption";

import type { Context } from "hono";
import type { RobloxExperienceNotificationMessageBody } from "..";

export default async function sendExperienceNotification(c: Context) {
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

  // Get Cloud-Api-Key from the request header
  const cloudApiKey = c.req.header("x-cloud-api-key");
  if (!cloudApiKey) {
    return c.json({ message: "Cloud-Api-Key is required", status: 400 });
  }

  const validatedBody = experienceNotificationSchema.safeParse(body);
  if (!validatedBody.success) {
    return c.json({ message: validatedBody.error.errors, status: 400 });
  }

  const { userId, universeId, assetId, delayTimestamp } = validatedBody.data;

  // We will encrypt the apiKey (chacha20-poly1305)
  const encryptedApiKey = new Encryption().encrypt(cloudApiKey);

  if (!encryptedApiKey) {
    return c.json({ message: "Failed to encrypt API key", status: 500 });
  }

  // We can send the message
  const message: RobloxExperienceNotificationMessageBody = {
    type: "experienceNotification",
    body: {
      userId: parseInt(userId),
      apiKey: encryptedApiKey,
      universeId: universeId,
      assetId: assetId,
    },
  };

  // Calculate the delay in milliseconds
  const delayMs = delayTimestamp ? new Date(parseInt(delayTimestamp)).getTime() - Date.now() : undefined;

  // If delayMs is provided and is less than 0, return a 400 error
  if (delayMs && delayMs < 0) {
    return c.json({ message: "Delay timestamp is in the past", status: 400 });
  }

  try {
    const jobId = await RobloxExperienceNotificationsService.queueRobloxExperienceNotification(
      message,
      delayMs
    );

    return c.json({ message: "Experience notification sent to the queue", jobId, status: 200 });
  } catch (e) {
    console.error(e);
    return c.json({ message: "Failed to send experience notification to the queue", status: 500 });
  }
}
