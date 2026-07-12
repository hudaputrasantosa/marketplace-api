import { Queue, Worker, type Processor } from "bullmq";
import { config } from "../config/env";
import { logger } from "../logger/logger";

/** BullMQ requires maxRetriesPerRequest: null for its blocking connections. */
const connection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
};

const registeredQueues = new Map<string, Queue>();
const queueRegisteredListeners = new Set<(queue: Queue) => void>();

/** Create a BullMQ queue ready to use for any module's background jobs. */
export function createQueue<T = unknown>(name: string): Queue<T> {
  const queue = new Queue<T>(name, { connection });
  registeredQueues.set(name, queue as unknown as Queue);
  for (const listener of queueRegisteredListeners) listener(queue as unknown as Queue);
  return queue;
}

/** Create a BullMQ worker for the given queue name. Call this explicitly to start processing. */
export function createWorker<T = unknown>(name: string, processor: Processor<T>): Worker<T> {
  const worker = new Worker<T>(name, processor, { connection });
  worker.on("failed", (job, error) => {
    logger.error(`Job ${job?.id} on queue "${name}" failed: ${error.message}`);
  });
  return worker;
}

/** Every queue created so far via createQueue() - used to seed the Bull Board dashboard. */
export function getRegisteredQueues(): Queue[] {
  return Array.from(registeredQueues.values());
}

/** Notifies `listener` about every queue created from now on (e.g. lazily-created ones), so the dashboard stays in sync even if it was mounted before those queues existed. */
export function onQueueRegistered(listener: (queue: Queue) => void): void {
  queueRegisteredListeners.add(listener);
}

export const EXAMPLE_QUEUE_NAME = "example-jobs";

let exampleQueue: Queue | undefined;

/** Lazily creates the example queue so no Redis connection is opened until it's actually used. */
export function getExampleQueue(): Queue {
  exampleQueue ??= createQueue(EXAMPLE_QUEUE_NAME);
  return exampleQueue;
}

/** Example worker showing how to process jobs from exampleQueue. Not started automatically. */
export function startExampleWorker(): Worker {
  return createWorker(EXAMPLE_QUEUE_NAME, async (job) => {
    logger.info(`Processing example job ${job.id} with data: ${JSON.stringify(job.data)}`);
  });
}
