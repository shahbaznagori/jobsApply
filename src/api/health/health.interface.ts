export interface IQueueHealth {
  waiting: number;
  active: number;
  failed: number;
}

export interface IHealthResponse {
  status: "ok" | "error";
  db: "connected" | "disconnected";
  redis: "connected" | "disconnected";
  queues: {
    notifications: IQueueHealth;
    "stats-updates": IQueueHealth;
    "audit-logs": IQueueHealth;
  };
  uptime: number;
}