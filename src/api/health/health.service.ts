import db from "../../common/config/db";
import redis from "../../common/config/redis";
import queueManager from "../../queues/queues";

class HealthService {
  public async getHealth() {
    try {
      let dbStatus: "connected" | "disconnected" = "connected";
      let redisStatus: "connected" | "disconnected" = "connected";

      // Check database
      try {
        db.prepare("SELECT 1").get();
      } catch (error) {
        dbStatus = "disconnected";
      }

      // Check Redis
      try {
        await redis.ping();
      } catch (error) {
        redisStatus = "disconnected";
      }

      // Get queue counts
      const [
        notificationCounts,
        statsCounts,
        auditCounts,
      ] = await Promise.all([
        queueManager.notificationQueue.getJobCounts(
          "waiting",
          "active",
          "failed"
        ),

        queueManager.statsQueue.getJobCounts(
          "waiting",
          "active",
          "failed"
        ),

        queueManager.auditQueue.getJobCounts(
          "waiting",
          "active",
          "failed"
        ),
      ]);

      const dlqCounts =
  await queueManager.notificationDlq.getJobCounts(
    "waiting",
    "active",
    "failed"
  );

console.log("Notification DLQ:", dlqCounts);

      const isHealthy =
        dbStatus === "connected" &&
        redisStatus === "connected";

      return {
        status: isHealthy ? "ok" : "error",

        db: dbStatus,

        redis: redisStatus,

        queues: {
          notifications: {
            waiting: notificationCounts.waiting,
            active: notificationCounts.active,
            failed: notificationCounts.failed,
          },

          "stats-updates": {
            waiting: statsCounts.waiting,
            active: statsCounts.active,
            failed: statsCounts.failed,
          },

          "audit-logs": {
            waiting: auditCounts.waiting,
            active: auditCounts.active,
            failed: auditCounts.failed,
          },
        },

        uptime: Math.floor(process.uptime()),
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new HealthService();