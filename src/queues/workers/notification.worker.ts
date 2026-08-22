import { Worker, Job } from "bullmq";
import redis from "../../common/config/redis";
import { QUEUE_NAMES } from "../queue-names";
import queueManager from "../queues";

class NotificationWorker {
  private worker: Worker;

  constructor() {
    this.worker = new Worker(
      QUEUE_NAMES.NOTIFICATION,
      this.processJob.bind(this),
      {
        connection: redis,
      }
    );

    this.registerEvents();
  }

  private async processJob(job: Job): Promise<void> {
    try {
      console.log(
        `Processing notification job: ${job.id}`
      );

      // throw new Error("Notification failed"); // for checking the  dlq we can intentionally throw error

    //      await new Promise((resolve) =>
    //   setTimeout(resolve, 1000)
    // );

      console.log(
        "Sending notification for application:",
        job.data
      );

      // Temporary failure for testing
      // throw new Error("Notification failed");

    } catch (error) {
      throw error;
    }
  }

  private registerEvents(): void {
    this.worker.on("completed", (job) => {
      console.log(
        `Notification job ${job.id} completed`
      );
    });

    this.worker.on("failed", async (job, error) => {
      if (!job) {
        return;
      }

      console.error(
        `Notification job ${job.id} failed:`,
        error.message
      );

      const maxAttempts =
        job.opts.attempts ?? 1;
       
      const attemptsExhausted =
        job.attemptsMade >= maxAttempts;

      
        if (attemptsExhausted) {
        try {
          await queueManager.notificationDlq.add(
            "dead-letter",
            {
              originalJobId: job.id,
              originalJobName: job.name,
              data: job.data,
              failedReason: error.message,
              attemptsMade: job.attemptsMade,
            },
            {
              jobId: `dlq-notification-${job.id}`,
            }
          );

          console.log(
            `Notification job ${job.id} moved to DLQ`
          );
        } catch (dlqError) {
          console.error(
            `Failed to move notification job ${job.id} to DLQ:`,
            dlqError
          );
        }
      }
    });
  }
}

export default new NotificationWorker();