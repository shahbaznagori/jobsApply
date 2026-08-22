Technical Decisions

1. Database — SQLite

Decision: Use SQLite as the primary database for the assessment implementation.

Why:

Keeps the project simple and easy to run locally.
Requires no separate database server.
Is sufficient for demonstrating the required application and queue workflows.
Allows the implementation to focus on the backend and asynchronous processing requirements.

Trade-off:
SQLite is not intended for the expected production scale. For production, I would migrate to MySQL or PostgreSQL with proper connection pooling, indexing, backups, and replication/read replicas where required.

2. Background Processing — BullMQ + Redis

Decision: Use BullMQ with Redis for asynchronous background jobs.

Why:

Prevents non-critical work from blocking the application request.
Provides persistent job queues and worker-based processing.
Supports retries, backoff, failed jobs, and queue monitoring.
Allows workers to scale independently from the API.

Trade-off:
Redis becomes an additional infrastructure dependency and requires monitoring and failure handling.

3. Separate Queues for Different Responsibilities

Decision: Use three independent queues:

send-notification
update-stats
write-audit-log

Why:
Each type of background work has a different responsibility and can fail or scale independently. A problem with notification processing should not prevent stats or audit jobs from being processed.

Trade-off:
Multiple queues require more configuration and monitoring than using a single generic queue.

4. Separate Workers

Decision: Create a dedicated worker for each queue.

Why:

Keeps notification, statistics, and audit processing isolated.
Allows each worker to be scaled independently later.
Makes failures easier to identify and monitor.
Keeps background processing separate from the API process.

Trade-off:
There are more processes to start, monitor, and deploy.

5. API and Workers Run as Separate Processes

Decision: Run the API through server.ts and background workers through a separate worker.ts process.

Why:
The API should handle HTTP requests while workers continuously process BullMQ jobs. Separating them prevents background processing from being tied to the API process and allows the two workloads to scale independently.

Trade-off:
The API and workers must be started and managed separately.

6. Retry Strategy

Decision: Configure BullMQ jobs with three attempts and exponential backoff starting at one second.

Why:
Transient failures such as temporary network or service issues should not immediately cause a job to fail permanently. Exponential backoff also prevents repeated immediate retries from putting additional pressure on a failing dependency.

Configuration:

Attempts: 3
Backoff: exponential
Initial delay: 1000ms

Trade-off:
Retries increase the time before a permanently failing job is considered failed and may cause duplicate side effects if the underlying operation is not idempotent.

7. Dead Letter Queue (DLQ)

Decision: Jobs that continue to fail after the configured retry attempts are moved to a Dead Letter Queue.

Why:
Failed jobs should not be silently discarded. Keeping them in a DLQ allows them to be inspected, monitored, and potentially reprocessed after the underlying problem is fixed.

Trade-off:
The DLQ requires monitoring and an operational process for investigating and replaying failed jobs.

8. Synchronous vs Asynchronous Application Processing

Decision: Persist the application synchronously and process notification, statistics, and audit work asynchronously.

Why:
The API should confirm that the application has been successfully persisted before returning success. Non-critical operations should not increase the API response time unnecessarily.

The flow is:

Application request
→ Save application
→ Enqueue background jobs
→ Return response

The workers then process:

Notification
Statistics
Audit logging

Trade-off:
The API response only confirms the application submission and job enqueueing; background operations may complete later or require retries.

9. Queue Job Reliability

Decision: Use BullMQ's retry and failed-job mechanisms rather than implementing custom retry loops inside the workers.

Why:
BullMQ already provides job attempts, backoff, failed-job tracking, and worker events. Using these features keeps the worker implementation simple and avoids duplicating queue-management logic.

Trade-off:
The application becomes dependent on BullMQ's queue semantics and Redis availability.

10. Health Check

Decision: Provide a health endpoint that reports application, database, Redis, and queue status.

Why:
A simple HTTP success response is not enough to determine whether the system is actually healthy. The endpoint provides visibility into database connectivity, Redis connectivity, and the state of the background queues.

The queue information includes:

Waiting jobs
Active jobs
Failed jobs

This makes it possible to identify problems such as workers falling behind or jobs accumulating in a queue.