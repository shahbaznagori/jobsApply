import { Worker, Job } from "bullmq";
import redis from "../../common/config/redis";
import { QUEUE_NAMES } from "../queue-names";
import queueManager from "../queues";

class StatsWorker {
  private worker: Worker;

  constructor() {
    this.worker = new Worker(
      QUEUE_NAMES.STATS,
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
        `Processing stats job: ${job.id}`
      );

    //      await new Promise((resolve) =>
    //   setTimeout(resolve, 1000)
    // );

      console.log(
        "Updating stats for application:",
        job.data
      );

      // Temporary failure for testing
      // throw new Error("Stats update failed");

    } catch (error) {
      throw error;
    }
  }

  private registerEvents(): void {
    this.worker.on("completed", (job) => {
      console.log(
        `Stats job ${job.id} completed`
      );
    });

    this.worker.on("failed", async (job, error) => {
      if (!job) {
        return;
      }

      console.error(
        `Stats job ${job.id} failed:`,
        error.message
      );

      const maxAttempts =
        job.opts.attempts ?? 1;

      const attemptsExhausted =
        job.attemptsMade >= maxAttempts;

      if (attemptsExhausted) {
        try {
          await queueManager.statsDlq.add(
            "dead-letter",
            {
              originalJobId: job.id,
              originalJobName: job.name,
              data: job.data,
              failedReason: error.message,
              attemptsMade: job.attemptsMade,
            },
            {
              jobId: `dlq-stats-${job.id}`,
            }
          );

          console.log(
            `Stats job ${job.id} moved to DLQ`
          );
        } catch (dlqError) {
          console.error(
            `Failed to move stats job ${job.id} to DLQ:`,
            dlqError
          );
        }
      }
    });
  }
}

export default new StatsWorker();