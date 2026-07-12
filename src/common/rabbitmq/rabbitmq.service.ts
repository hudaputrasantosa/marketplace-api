import amqplib, { type Channel, type ChannelModel } from "amqplib";
import { config } from "../config/env";
import { logger } from "../logger/logger";

/**
 * Thin shared RabbitMQ publisher/consumer, ready to use for publishing or receiving domain
 * events. Connects lazily on first publish()/consume()/checkConnection() call so importing
 * this module doesn't require RabbitMQ to be up (e.g. during typecheck/tests).
 */
export class RabbitMqService {
  private connection?: ChannelModel;
  private channel?: Channel;

  private async ensureChannel(): Promise<Channel> {
    if (this.channel) return this.channel;
    this.connection = await amqplib.connect(config.rabbitmq.url);
    this.channel = await this.connection.createChannel();
    return this.channel;
  }

  async publish(queue: string, payload: unknown): Promise<void> {
    const channel = await this.ensureChannel();
    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), { persistent: true });
    logger.info(`Published message to queue "${queue}"`);
  }

  async consume(queue: string, handler: (payload: unknown) => Promise<void>): Promise<void> {
    const channel = await this.ensureChannel();
    await channel.assertQueue(queue, { durable: true });
    await channel.consume(queue, async (msg) => {
      if (!msg) return;
      await handler(JSON.parse(msg.content.toString()));
      channel.ack(msg);
    });
  }

  /** Health check used for the startup connectivity log. */
  async checkConnection(): Promise<void> {
    await this.ensureChannel();
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}

export const rabbitMqService = new RabbitMqService();

export const EXAMPLE_EVENTS_QUEUE = "example-events";

/**
 * Example consumer showing this service can receive messages from an external publisher.
 * Not started automatically - call this explicitly wherever you want to react to the queue.
 */
export async function startExampleConsumer(): Promise<void> {
  await rabbitMqService.consume(EXAMPLE_EVENTS_QUEUE, async (payload) => {
    logger.info(
      `Received message from queue "${EXAMPLE_EVENTS_QUEUE}": ${JSON.stringify(payload)}`,
    );
  });
}
