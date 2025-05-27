import Encryption from "~/crypto/encryption";

import type { Job } from "bullmq";
import type { RobloxExperienceNotificationMessageBody } from "..";
import type { Status } from "~/services/roblox-experience-service";

const NOTIFICATIONS_API_URL = (userId: number) => `https://apis.roblox.com/cloud/v2/users/${userId}/notifications`;

export default async function executeExperienceNotification(data: {
  message: RobloxExperienceNotificationMessageBody;
  job: Job<{
    message: RobloxExperienceNotificationMessageBody;
    status: Status;
  }>;
}) {
  const { message, job } = data;
  const { userId, apiKey, universeId, assetId } = message.body;

  // We will decrypt the apiKey (chacha20-poly1305)
  const decryptedApiKey = new Encryption().decrypt(apiKey);

  // If the apiKey is not valid, we will throw an error
  if (!decryptedApiKey) {
    throw new Error("Invalid API key");
  }

  job.updateData({
    ...job.data,
    status: "processing",
  });

  try {
    const response = await fetch(NOTIFICATIONS_API_URL(userId), {
      method: "POST",
      headers: {
        "x-api-key": `${decryptedApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        source: {
          universe: `universes/${universeId}`
        },
        payload: {
          message_id: `${assetId}`,
          type: "MOMENT"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to send experience notification: ${response.statusText}`);
    }

    job.updateData({
      ...job.data,
      status: "completed",
    });
  } catch (error) {
    console.error("The experience notification failed to send:", error);
    job.updateData({
      ...job.data,
      status: "failed",
    });

    throw error;
  }
}

