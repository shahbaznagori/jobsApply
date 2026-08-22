# WeApplyJobs — Backend Engineering Assessment

## 1. Project Overview

WeApplyJobs is a backend application for submitting job applications.

The application uses:

* Node.js
* TypeScript
* Express
* SQLite
* Redis
* BullMQ
* `express-validator`

The application API and background workers run as separate processes.


# 2. How to Run the Project

## Prerequisites

Install the following:

* Node.js
* npm
* Redis

Redis must be running because BullMQ uses Redis for queue management.

---

## Install Dependencies

From the project root:

npm install


## Environment Variables
Create a `.env` file in the project root.

Example:
PORT=5000
REDIS_URL=redis://localhost:6379


## Start Redis

Start Redis locally:

redis-server

Keep Redis running while the application is running.


## Start the API Server

Open a terminal in the project root:

npm run dev


The current `package.json` uses:
"dev": "tsx watch server.ts"


The API server runs on:

http://localhost:5000


For a normal start without watch mode: npm start



## Start the Workers
The workers have a separate entry point:
worker.ts


The worker entry point loads these three files 

notification.worker.ts
stats.worker.ts
audit.worker.ts


Open a **second terminal** in the project root and run:
npm run worker
tsx worker.ts

The workers run independently from the API server and consume BullMQ jobs from Redis.

---

# 3. API Endpoints
## Health Check

GET /weapplyjobs/health
Example: http://localhost:5000/weapplyjobs/health


The health endpoint reports:

* API status
* Database connection
* Redis connection
* Queue status
* Waiting jobs
* Active jobs
* Failed jobs
* Application uptime

Example response:

```json
{
  "status": "ok",
  "db": "connected",
  "redis": "connected",
  "queues": {
    "notifications": {
      "waiting": 0,
      "active": 0,
      "failed": 0
    },
    "stats-updates": {
      "waiting": 0,
      "active": 0,
      "failed": 0
    },
    "audit-logs": {
      "waiting": 0,
      "active": 0,
      "failed": 0
    }
  },
  "uptime": 37
}
```

If the database or Redis is unavailable, the health endpoint returns an unhealthy response with HTTP `503`.

---

## Create Application
POST /weapplyjobs/api/applications


Example request:

```json
{
  "jobId": "job-1",
  "candidateId": "candidate-1",
  "recruiterId": "recruiter-1",
  "coverLetter": "I am interested in this position."
}
```

The application is persisted in SQLite.
A unique constraint prevents the same candidate from applying to the same job more than once.

UNIQUE(candidate_id, job_id)


# 4. Asynchronous Job Processing
When an application is created, background jobs are dispatched to BullMQ.
The application uses three queues:

send-notification
update-stats
write-audit-log


The API does not perform these background operations synchronously.
Instead:

POST /applications
        │
        ▼
 Save application
        │
        ▼
 Dispatch jobs
        │
        ▼
      Redis
        │
        ├── send-notification
        ├── update-stats
        └── write-audit-log
              │
              ▼
           Workers

The workers are started separately using `worker.ts`.

---

# 5. Retry Mechanism
Jobs are configured with:

Attempts: 3
Backoff: exponential
Initial delay: 1000 ms


The retry flow is:

Attempt 1
   │
   └── Failure
         │
         ▼
     Backoff
         │
         ▼
Attempt 2
   │
   └── Failure
         │
         ▼
     Backoff
         │
         ▼
Attempt 3
   │
   └── Failure
         │
         ▼
     Attempts exhausted


BullMQ handles the retry mechanism automatically based on the queue's job options.


# 6. Dead-Letter Queue
Each primary queue has a corresponding dead-letter queue:

send-notification
        └── send-notification-dlq

update-stats
        └── update-stats-dlq

write-audit-log
        └── write-audit-log-dlq


A failed job is not immediately moved to the DLQ.
It first goes through all configured retry attempts.
Only after the retries are exhausted is the job added to the corresponding DLQ.

Job
 │
 ▼
Attempt 1 ── Failed
 │
 ▼
Attempt 2 ── Failed
 │
 ▼
Attempt 3 ── Failed
 │
 ▼
DLQ

The original failed BullMQ job is also retained because failed jobs are configured not to be automatically removed.

# 7. Demonstrating Queue Processing

The project contains a `test.ts` script for demonstrating concurrent application requests.
Run it from a third terminal:

npx tsx test.ts


The script sends 20 concurrent requests to:

POST /weapplyjobs/api/applications

Each application creates background jobs for the three queues.

Therefore, 20 applications can generate approximately:

20 notification jobs
20 stats jobs
20 audit jobs

for a total of approximately:

60 background jobs

The queue activity can be observed through:
GET /weapplyjobs/health


Example:

```json
{
  "status": "ok",
  "db": "connected",
  "redis": "connected",
  "queues": {
    "notifications": {
      "waiting": 16,
      "active": 1,
      "failed": 0
    },
    "stats-updates": {
      "waiting": 16,
      "active": 1,
      "failed": 0
    },
    "audit-logs": {
      "waiting": 16,
      "active": 1,
      "failed": 0
    }
  },
  "uptime": 37
}
```

The queue depths decrease as the workers process the jobs.


# 8. Testing Retry and DLQ
For testing purposes, a worker can temporarily be configured to throw an error.

For example:

```ts
throw new Error("Notification failed");
```

BullMQ then retries the job according to the configured retry policy.

After all attempts fail, the job is moved to the notification DLQ.

The behavior was verified with 20 failed notification jobs:

Notification DLQ:
{
  waiting: 20,
  active: 0,
  failed: 0
}
The temporary forced failure should be disabled after testing.

