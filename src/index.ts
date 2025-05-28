import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { createBullBoard } from "@bull-board/api";
import { serveStatic } from "@hono/node-server/serve-static";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { HonoAdapter } from "@bull-board/hono";
import { RobloxExperienceNotificationsService } from "./services/roblox-experience-service";
import { QUEUES } from "./queue/queue-constants";
import { showRoutes } from "hono/dev";
import { config } from "./config";
import fastRedact from "fast-redact";

// Routes
import getExperienceNotificationStatus from "./routes/getExperienceNotificationStatus";
import cancelExperienceNotification from "./routes/cancelExperienceNotification";
import sendExperienceNotification from "./routes/sendExperienceNotification";

// Middleware
import { logging } from "./middleware/logging";
import { parseGzippedJson } from "./middleware/gzip-json";
import { errorHandler } from "./middleware/error";

// Constants
const PORT = 3031;

// We don't want to expose these fields in the queue
const redact = fastRedact({
  paths: ["message.body.apiKey", "message.body.universeId", "message.body.assetId", "message.body.userId"]
});

/**
 * Roblox experience notification message body
 */
export interface RobloxExperienceNotificationMessageBody {
	type: string;
	body: {
		userId: number;
		apiKey: string;
		universeId: string;
		assetId: string;
	};
}

/**
 * Initialize the server
 */
async function init() {
  // Initialize the RobloxExperienceService
  RobloxExperienceNotificationsService.init();

  // Create the Hono app
  const app = new Hono();

  // Logging
  app.use(logging);

  // Parse the request body as a JSON object
  app.use(parseGzippedJson);

  // Error handler
  app.onError(errorHandler);

  // If the environment is development, serve the UI
  if (config.misc.NODE_ENV === "development") {
    const serverAdapter = new HonoAdapter(serveStatic);
    const queueAdapters = Object.values(QUEUES).map(queue => new BullMQAdapter(
			RobloxExperienceNotificationsService.robloxExperienceNotificationsQueues.get(queue)!,
			{
			  readOnlyMode: true,
			}
    ));

    for (const adapter of queueAdapters) {
      adapter.setFormatter("data", (data) => redact(data));
    }

    createBullBoard({
      queues: queueAdapters,
      serverAdapter,
    });

    const basePath = "/ui";
    serverAdapter.setBasePath(basePath);
    app.route(basePath, serverAdapter.registerPlugin());
  }

  app.use("/api/*", cors());

  // Health check
  app.get("/", async (c) => {
    const amountOfJobsInQueue = await RobloxExperienceNotificationsService.getAmountOfJobsInQueue(QUEUES.ROBLOX_EXPERIENCE_NOTIFICATIONS) as {
      failed: number;
      processing: number;
      queued: number;
    };

    return c.json({
      message: amountOfJobsInQueue.failed > 100 ? "There are a lot of failed jobs in the queue. Please check the logs." : "Everything is working fine.",
      jobs: amountOfJobsInQueue,
      status: 200,
      routes: [
        {
          method: "GET",
          path: "/api/get-experience-notification-status",
        },
        {
          method: "POST",
          path: "/api/cancel-experience-notification",
        },
        {
          method: "POST",
          path: "/api/send-experience-notification",
        }
      ]
    });
  });

  app.get("/api/get-experience-notification-status", getExperienceNotificationStatus);
  app.post("/api/cancel-experience-notification", cancelExperienceNotification);
  app.post("/api/send-experience-notification", sendExperienceNotification);

  // Show the routes
  showRoutes(app);

  // Start the server :3
  serve({
    port: PORT,
    fetch: app.fetch,
  }, () => {
    console.log(`The server is running on http://localhost:${PORT}/`);
  });
}

init().catch(console.error);