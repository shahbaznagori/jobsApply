export const QUEUE_NAMES = {
  NOTIFICATION: "send-notification",
  STATS: "update-stats",
  AUDIT: "write-audit-log",

  NOTIFICATION_DLQ: "send-notification-dlq",
  STATS_DLQ: "update-stats-dlq",
  AUDIT_DLQ: "write-audit-log-dlq",
} as const;