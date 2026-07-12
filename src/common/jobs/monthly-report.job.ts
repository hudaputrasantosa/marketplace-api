import { and, count, gte, lt, sum } from "drizzle-orm";
import { config } from "../config/env";
import { db } from "../database/client";
import { transactions } from "../database/schema";
import { logger } from "../logger/logger";
import { createQueue, createWorker } from "../queue/queue.service";

export const MONTHLY_REPORT_QUEUE = "monthly-report";
const MONTHLY_REPORT_SCHEDULER_ID = "monthly-report";

function getLastMonthRange(reference: Date): { start: Date; end: Date; period: string } {
  const start = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
  const end = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const period = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
  return { start, end, period };
}

/** Aggregates last month's transactions (count + revenue) and logs the result. */
export async function generateMonthlyReport(reference: Date = new Date()) {
  const { start, end, period } = getLastMonthRange(reference);

  const [row] = await db
    .select({
      totalTransactions: count(),
      totalRevenue: sum(transactions.totalPrice),
    })
    .from(transactions)
    .where(and(gte(transactions.createdAt, start), lt(transactions.createdAt, end)));

  const report = {
    period,
    totalTransactions: row?.totalTransactions ?? 0,
    totalRevenue: Number(row?.totalRevenue ?? 0),
  };

  logger.info(report, "Monthly transaction report generated");
  return report;
}

/** Registers the BullMQ repeatable job that runs generateMonthlyReport() on a cron schedule. */
export async function scheduleMonthlyReportJob(): Promise<void> {
  const queue = createQueue(MONTHLY_REPORT_QUEUE);
  createWorker(MONTHLY_REPORT_QUEUE, async () => {
    await generateMonthlyReport();
  });

  await queue.upsertJobScheduler(
    MONTHLY_REPORT_SCHEDULER_ID,
    { pattern: config.jobs.monthlyReportCron },
    { name: MONTHLY_REPORT_SCHEDULER_ID },
  );

  logger.info(`Monthly report job scheduled (cron: ${config.jobs.monthlyReportCron})`);
}
