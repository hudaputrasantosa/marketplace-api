import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { config } from "../config/env";
import { logger } from "../logger/logger";

let sdk: NodeSDK | undefined;

/**
 * Bootstraps OpenTelemetry tracing, ready for future Grafana/Tempo integration via OTLP.
 * Must be called - and awaited - before importing any instrumented module (fastify, mysql2,
 * etc.), otherwise auto-instrumentation can't patch them in time. Gated behind OTEL_ENABLED
 * since it's off by default.
 *
 * Caveat: Bun's Node compatibility layer has known gaps with some Node auto-instrumentation
 * hooks, so tracing under Bun may be incomplete compared to running on Node directly.
 */
export function startOtel(): void {
  if (!config.observability.otel.enabled) {
    return;
  }

  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: config.observability.otel.serviceName,
    }),
    traceExporter: new OTLPTraceExporter({
      url: `${config.observability.otel.exporterUrl}/v1/traces`,
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
  logger.info(`OpenTelemetry started, exporting to ${config.observability.otel.exporterUrl}`);
}

export async function stopOtel(): Promise<void> {
  await sdk?.shutdown();
}
