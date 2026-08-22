import { Queue } from "bullmq";
import redis from "../common/config/redis";
import { QUEUE_NAMES } from "./queue-names";
import { defaultJobOptions } from "./queue-options";

class QueueManager {
  public readonly notificationQueue: Queue;
  public readonly statsQueue: Queue;
  public readonly auditQueue: Queue;

  public readonly notificationDlq: Queue;
  public readonly statsDlq: Queue;
  public readonly auditDlq: Queue;

  constructor() {
    this.notificationQueue = new Queue(
      QUEUE_NAMES.NOTIFICATION,
      {
        connection: redis,
        defaultJobOptions,
      }
    );

    this.statsQueue = new Queue(
      QUEUE_NAMES.STATS,
      {
        connection: redis,
        defaultJobOptions,
      }
    );

    this.auditQueue = new Queue(
      QUEUE_NAMES.AUDIT,
      {
        connection: redis,
        defaultJobOptions,
      }
    );

    this.notificationDlq = new Queue(
      QUEUE_NAMES.NOTIFICATION_DLQ,
      {
        connection: redis,
      }
    );

    this.statsDlq = new Queue(
      QUEUE_NAMES.STATS_DLQ,
      {
        connection: redis,
      }
    );

    this.auditDlq = new Queue(
      QUEUE_NAMES.AUDIT_DLQ,
      {
        connection: redis,
      }
    );
  }
}

export default new QueueManager();