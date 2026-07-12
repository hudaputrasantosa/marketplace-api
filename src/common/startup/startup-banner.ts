import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import boxen from "boxen";
import chalk from "chalk";
import Table from "cli-table3";
import ora from "ora";
import { config } from "../config/env";
import { BULL_BOARD_ROUTE_PREFIX } from "../plugins/bull-board.plugin";

export type DependencyCheckResult = {
  name: string;
  status: "connected" | "unavailable";
  ms: number;
};

type SpinnerOutcome<T> = { value?: T; error?: unknown; ms: number };

/**
 * Runs `fn`, timing it. In development it's wrapped with an Ora spinner (start/succeed/fail) -
 * outside development this just times the call silently, since Ora's ANSI escape codes assume an
 * interactive TTY and are noisy in piped Docker logs (Ora is optional/dev-only per the original
 * ask).
 */
export async function withSpinner<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<SpinnerOutcome<T>> {
  const start = performance.now();
  const spinner = config.app.isDevelopment ? ora(label).start() : undefined;

  try {
    const value = await fn();
    const ms = performance.now() - start;
    spinner?.succeed(`${label} (${Math.round(ms)}ms)`);
    return { value, ms };
  } catch (error) {
    const ms = performance.now() - start;
    spinner?.fail(label);
    return { error, ms };
  }
}

function readPackageJson(): { name?: string; version?: string } {
  const nodeRequire = createRequire(import.meta.url);
  return nodeRequire("../../../package.json") as { name?: string; version?: string };
}

function resolveCommitSha(): string {
  if (config.app.commitSha) return config.app.commitSha;
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

/** Prints the boxen header + cli-table3 dependency table + colorized URL list once the app is listening. */
export function printStartupBanner(input: {
  dependencies: DependencyCheckResult[];
  port: number;
}): void {
  const pkg = readPackageJson();
  const commit = resolveCommitSha();

  const header = boxen(
    [
      chalk.bold.cyan(pkg.name ?? "marketplace-api"),
      `${chalk.dim("Version:")}     ${pkg.version ?? "0.0.0"}`,
      `${chalk.dim("Environment:")} ${chalk.yellow(config.app.nodeEnv)}`,
      `${chalk.dim("Commit:")}      ${commit}`,
    ].join("\n"),
    {
      padding: 1,
      margin: { top: 1, bottom: 0, left: 0, right: 0 },
      borderStyle: "round",
      borderColor: "cyan",
    },
  );
  console.log(header);

  const table = new Table({ head: ["Dependency", "Status", "Latency"] });
  for (const dependency of input.dependencies) {
    const status =
      dependency.status === "connected" ? chalk.green("Connected") : chalk.yellow("Unavailable");
    table.push([dependency.name, status, `${Math.round(dependency.ms)}ms`]);
  }
  console.log(table.toString());

  const appUrl = `http://localhost:${input.port}`;
  const rabbitMqConnected = input.dependencies.some(
    (dependency) => dependency.name === "RabbitMQ" && dependency.status === "connected",
  );

  console.log(
    [
      "",
      `${chalk.dim("App:")}          ${chalk.underline(appUrl)}`,
      `${chalk.dim("Docs:")}         ${chalk.underline(`${appUrl}/api/docs`)}`,
      `${chalk.dim("Healthcheck:")}  ${chalk.underline(`${appUrl}/health`)}`,
      `${chalk.dim("BullMQ Board:")} ${chalk.underline(`${appUrl}/api${BULL_BOARD_ROUTE_PREFIX}`)}`,
      rabbitMqConnected
        ? `${chalk.dim("RabbitMQ UI:")}  ${chalk.underline(config.rabbitmq.managementUrl)}`
        : chalk.dim("RabbitMQ UI:   unavailable (RabbitMQ not connected)"),
      "",
    ].join("\n"),
  );
}
