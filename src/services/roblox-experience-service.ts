import { Queue, Worker } from "bullmq";
import { QUEUES, DEFAULT_QUEUE_OPTIONS } from "~/queue/queue-constants";
import { getRedis } from "~/lib/redis";
import { v4 as uuidv4 } from "uuid";
import chalk from "chalk";
import executeExperienceNotification from "~/executors/executeExperienceNotification";

import type { Job, Processor } from "bullmq";
import type { RobloxExperienceNotificationMessageBody } from "..";

export type Status = "queued" | "processing" | "completed" | "failed";

// How many jobs can run at the same time for a worker (in parallel)
const ROBLOX_EXPERIENCE_NOTIFICATIONS_QUEUE_CONCURRENCY = 10;

/** Queue Functions */
const QUEUE_EXECUTE_FUNCTIONS = {
  [QUEUES.ROBLOX_EXPERIENCE_NOTIFICATIONS]: executeExperienceNotificationJob,
} as const;

/**
 * Create a queue and worker
 * @param queueName - The name of the queue
 * @param quota - The concurrency of the queue
 * @returns The queue and worker
 */
function createQueueAndWorker(queueName: string, executeFunction: Processor) {
  const queue = new Queue(
    queueName,
    {
      connection: getRedis(),
    }
  );

  const worker = new Worker(
    queueName,
    executeFunction,
    {
      concurrency: ROBLOX_EXPERIENCE_NOTIFICATIONS_QUEUE_CONCURRENCY,
      connection: getRedis(),
    }
  );

  return { queue, worker };
};

/**
 * Roblox experience service
 */
export class RobloxExperienceNotificationsService {
  private static initialized = false;
  private static initializationPromise: Promise<void> | null = null;

  // Icon Thumbnail Processor Queue
  public static robloxExperienceNotificationsQueues: Map<string, Queue> = new Map();
  public static robloxExperienceNotificationsWorkers: Map<string, Worker> = new Map();

  /**
   * Initialize a queue
   * @param queueName - The name of the queue
   */
  public static initializeQueues() {
    for (const queue of Object.values(QUEUES)) {
      if (this.robloxExperienceNotificationsQueues.has(queue) && this.robloxExperienceNotificationsWorkers.has(queue)) {
        continue;
      }

      const { queue: robloxExperienceNotificationsQueue, worker: robloxExperienceNotificationsWorker } = createQueueAndWorker(queue, QUEUE_EXECUTE_FUNCTIONS[queue]);
      this.robloxExperienceNotificationsQueues.set(queue, robloxExperienceNotificationsQueue);
      this.robloxExperienceNotificationsWorkers.set(queue, robloxExperienceNotificationsWorker);

      // Log
      console.log(chalk.green(`[RobloxExperienceNotificationsService]: Queue for ${queue} initialized`));
    }
  }

  /**
   * Get the roblox experience status
   * @param jobId - The job id
   * @returns The roblox experience status
   */
  public static async getRobloxExperienceNotificationStatus(jobId: string) {
    await this.ensureInitialized();

    let job: Job | null = null;

    for (const queue of this.robloxExperienceNotificationsQueues.keys()) {
      const queueObject = this.robloxExperienceNotificationsQueues.get(queue);
      if (queueObject) {
        job = await queueObject.getJob(jobId);

        if (job) {
          return job.data as {
            jobId: string;
            status: Status;
            message: RobloxExperienceNotificationMessageBody;
          };
        }
      }
    }

    return null;
  }

  /**
   * Cancel a job
   * @param jobId - The job id
   */
  public static async cancelJob(jobId: string) {
    await this.ensureInitialized();

    for (const queue of this.robloxExperienceNotificationsQueues.keys()) {
      const queueObject = this.robloxExperienceNotificationsQueues.get(queue);
      if (queueObject) {
        await queueObject.remove(jobId);
      }
    }

    return true;
  }

  /**
   * Get amount of jobs in the queue
   * @param queueName - The queue name
   * @returns The amount of jobs in the queue
   */
  public static async getAmountOfJobsInQueue(queueName: string) {
    await this.ensureInitialized();

    const queue = this.robloxExperienceNotificationsQueues.get(queueName);
    if (!queue) {
      throw new Error(`[RobloxExperienceNotificationsService]: Queue for ${queueName} not found`);
    }

    return queue.getJobCounts();
  }

  /**
   * Queue an roblox experience
   * @param message - The roblox experience message
   * @param delay - The delay
   */
  public static async queueRobloxExperienceNotification(
    message: RobloxExperienceNotificationMessageBody,
    delay: number = 25_000, // Default delay of 25 seconds
  ) {
    await this.ensureInitialized();

    const queue = this.robloxExperienceNotificationsQueues.get(QUEUES.ROBLOX_EXPERIENCE_NOTIFICATIONS);
    if (!queue) {
      throw new Error(`[RobloxExperienceNotificationsService]: Queue for ${QUEUES.ROBLOX_EXPERIENCE_NOTIFICATIONS} not found`);
    }

    const jobId = uuidv4();

    queue.add(
      jobId,
      {
        message,
        status: "queued",
      },
      { jobId, delay, ...DEFAULT_QUEUE_OPTIONS }
    );

    return jobId;
  }

  /**
   * Ensure the service is initialized
   */
  private static async ensureInitialized() {
    if (this.initialized) {
      return;
    }

    if (!this.initializationPromise) {
      this.initializationPromise = this.init();
    }

    await this.initializationPromise;
  }

  /**
   * Initialize the service
   */
  public static async init() {
    if (this.initialized) {
      console.log(`[RobloxExperienceNotificationsService]: Already initialized`);
      return;
    }

    // Initialize all queues
    this.initializeQueues();

    this.initialized = true;
    this.initializationPromise = null;
  }
}

/**
 * Execute the test
 * @param job - The job
 */
async function executeExperienceNotificationJob(
  job: Job<{
    message: RobloxExperienceNotificationMessageBody;
    status: Status;
  }>
) {
  const { message } = job.data;
  console.log(`[RobloxExperienceNotificationsService]: Executing experience notification job with data: ${JSON.stringify(message)}`);

  // Queue the experience notification
  await executeExperienceNotification({ message, job });
}
