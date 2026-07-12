import type { Queue } from "bullmq";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { FastifyAdapter } from "@bull-board/fastify";
import type { FastifyInstance } from "fastify";
import { basicAuthGuard } from "./basic-auth.guard";
import { config } from "../config/env";
import { getRegisteredQueues, onQueueRegistered } from "../queue/queue.service";

export const BULL_BOARD_ROUTE_PREFIX = "/admin/queues";

type BoardQueue = Parameters<typeof createBullBoard>[0]["queues"][number];

/**
 * @bull-board/api@5.23 (the newest release whose @bull-board/fastify still targets our
 * Fastify v4) types Job.progress as `number | object`, while the installed bullmq's Job.progress
 * additionally allows `string` - functionally compatible, so this narrows the mismatch away.
 */
function toBoardQueue(queue: Queue): BoardQueue {
  return new BullMQAdapter(queue) as unknown as BoardQueue;
}

/**
 * Mounts the Bull Board UI so BullMQ queues/jobs (e.g. the monthly report scheduler) can be
 * inspected and retried from a browser. Gated with HTTP Basic Auth rather than the app's JWT
 * bearer scheme - Bull Board is opened directly in a browser, which can't attach an
 * `Authorization: Bearer` header on plain navigation, so JWT auth would always reject it with
 * "Token required". Basic Auth makes the browser prompt for credentials natively instead.
 * Queues created after this runs (e.g. the lazily-created example queue) are picked up
 * automatically via onQueueRegistered.
 */
export async function registerBullBoard(app: FastifyInstance): Promise<void> {
  const serverAdapter = new FastifyAdapter();
  // Must be the full path as seen by the browser (this plugin is registered inside app.ts's
  // "/api"-prefixed group) - Bull Board's frontend bundle uses this to build the URLs for its
  // own AJAX calls fetching queue/job data. Passing just BULL_BOARD_ROUTE_PREFIX here leaves the
  // UI stuck on "loading..." forever, since those calls would 404 against the wrong path.
  serverAdapter.setBasePath(`/api${BULL_BOARD_ROUTE_PREFIX}`);

  const board = createBullBoard({
    queues: getRegisteredQueues().map(toBoardQueue),
    serverAdapter,
  });

  onQueueRegistered((queue) => board.addQueue(toBoardQueue(queue)));

  await app.register(
    async (instance) => {
      instance.addHook(
        "preHandler",
        basicAuthGuard("Bull Board", {
          username: config.bullBoard.username,
          password: config.bullBoard.password,
        }),
      );
      await instance.register(serverAdapter.registerPlugin());
    },
    { prefix: BULL_BOARD_ROUTE_PREFIX },
  );
}
