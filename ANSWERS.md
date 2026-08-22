



# PART -1

1. The daily incident occurs around the middle of the recruiters' shift when traffic increases. At 14:31:58–14:32:00, database connections rise from 45 → 48 → 51 while requests are still completing normally. At 14:32:01, the Prisma pool is fully occupied (`active=10`, `pool_size=10`) with 23 requests waiting for a connection. Since each serverless instance has its own Prisma pool, multiple instances can collectively create far more than 10 database connections. MySQL has a `max_connections` limit of 151, which is eventually reached, causing `Too many connections` errors. New requests then wait for a connection until the 10-second pool timeout and return 500 errors. As traffic falls, connections are released, dropping to 34 and then 31, and requests begin succeeding again. Therefore, the root issue is connection exhaustion across multiple serverless instances during the recurring workload peak, not simply an undersized Prisma pool.

2. Each serverless instance has its own Prisma connection pool of 10 connections. 
   MySQL has a maximum of 151 connections. Therefore:

151 ÷ 10 = 15.1

This means 15 fully utilized instances could use up to 150 connections, while 16 fully utilized instances could use up to 160 connections and exceed the MySQL limit.

At the same time, `active=10` and `queued=23` show that the observed pool was already fully occupied and 23 requests were waiting for a connection. However, `queued=23` does not mean there were 23 additional instances. The exact number of running instances cannot be determined from the provided logs because we do not know how many connections each instance was using. The logs only allow us to conclude that enough concurrent instances and connections existed to exhaust MySQL's 151-connection limit.

3. The system recovered automatically because the connection pressure was temporary. The requests and database operations holding connections eventually completed or timed out, releasing their connections back to the pools. This is visible in the logs: connections dropped from 51 at 14:32:00 to 34 at 14:32:08 and then 31 at 14:32:09. Once enough connections were released, new requests could obtain database connections again and returned 200 responses. This recovery does not fix the underlying connection-capacity problem; the same traffic pattern can cause the database to reach its connection limit again.

4. I would tell them that increasing connection_limit to 100 would make the problem worse, not fix it. MySQL allows only 151 total connections, while each serverless instance has its own Prisma pool. With a limit of 100, just two instances could potentially request up to 200 connections, already exceeding MySQL's capacity. During a traffic spike, more instances can run at the same time, making the database exhaust its connections even faster. We should control and reduce per-instance database connections rather than increasing the limit, and use connection pooling such as Prisma Accelerate to manage database connections more efficiently.

5. Prisma Accelerate adds a managed connection-pooling layer between the serverless functions and MySQL. Instead of every serverless instance creating its own independent connections, Accelerate reuses and manages connections, reducing connection pressure on MySQL.
This helps with the current problem because, for example, 
16 instances × 10 connections = 160 possible connections,
which already exceeds the MySQL limit of 151.
Accelerate reduces this connection amplification.
However, it does not increase MySQL's actual capacity. At 1,000 concurrent recruiters, database CPU, query throughput, write capacity, and transaction time can still become bottlenecks. Therefore, Accelerate solves the connection-management problem but is not a complete scaling solution.



PART -2 
# Answer 1:
1. Establish a baseline: Measure API latency, throughput, database CPU/connections, slow queries, error rates, and current read/write patterns. This gives us a baseline before making architectural changes.

2. Separate the recruiter workload: Introduce a dedicated recruiter/write service so the write-heavy recruiter workload can scale independently from the read-heavy user workload. I would first validate this service under the expected recruiter load before moving further.

3. Optimize and scale the database: Tune queries and indexes, configure connection pooling, and introduce MySQL read replicas for read-heavy workloads. I would monitor query latency, database CPU, connection usage, and replica lag.

4. Move non-critical work to asynchronous processing: Send notifications, statistics updates, audit logs, and similar work through BullMQ/Redis workers instead of blocking the application request. I would measure API latency, queue depth, processing latency, and failed jobs.

5. Add Redis caching for high-volume reads: Cache frequently requested data such as job listings to reduce repeated database reads. I would monitor cache hit rate, database read load, and API latency.

6. Load test and scale horizontally: Test the complete architecture against the target of 1,000 concurrent recruiters and 100,000 active users. Based on the results, scale application/worker instances and tune the database and cache. Success would be confirmed through p95/p99 latency, throughput, error rate, queue depth, database utilization, and replica lag.


# Answer 2:
Keeping recruiter and user workloads in the same backend is simpler and avoids additional service-to-service communication and operational overhead. However, their traffic patterns are fundamentally different: recruiters generate frequent writes such as creating, updating, and closing jobs, while users generate a much larger volume of read requests for browsing and searching jobs. If kept together, a spike in recruiter writes could consume application and database resources needed by user reads.

I would therefore separate them into a dedicated recruiter/write service and a user/read service so they can be scaled and optimized independently. The recruiter service can be optimized for write throughput, while the user service can use read replicas and Redis caching for high-volume reads. The trade-off is additional deployment, monitoring, and networking complexity, so I would introduce this separation incrementally rather than creating many services immediately.


# Answer 3:
I would not introduce horizontal database sharding as the first solution. Sharding can increase write capacity, but it adds significant complexity around shard keys, cross-shard queries, transactions, backups, and operations. Given the expected workload of 100,000 active users and 1,000 concurrent recruiters, I would first optimize indexes and queries, configure connection pooling, use read replicas for read-heavy traffic, add Redis caching, and scale the primary database vertically if necessary. I would consider sharding only if the primary database remains the bottleneck after these optimizations and scaling options have been exhausted.

# Answer 4:
The application database insert should remain synchronous because the API must confirm that the application was successfully persisted before returning a success response. Sending the notification email, updating recruiter statistics, writing the audit log, and sending the WhatsApp message should be asynchronous because none of them needs to block the user's request. I would publish separate jobs for these operations to BullMQ backed by Redis, with dedicated workers processing them independently. This keeps the API response fast and prevents slow external services, such as the ~800ms email operation, from increasing request latency.

# Answer 5:
After a recruiter closes a job, a candidate can see stale data in three ways: (1) their client may already have the previously-open job listing cached, (2) Redis may still contain the old OPEN job entry because it has not expired, and (3) a cached job-list/search result may still contain the closed job even if the individual job cache was invalidated. I would prevent these by invalidating client-side cached data where applicable, immediately invalidating the affected Redis job key on job updates, and invalidating or versioning related list/search cache keys. The 5-minute TTL should be treated as a fallback rather than the primary consistency mechanism.



PART-4 

# Answer 1:
I would determine the connection pool size based on the database capacity and expected workload. The variables I need are CPU cores, effective spindle/storage count, database operation rate, average connection hold time, number of application instances, and the database's maximum connection limit. A common starting formula is Pool Size ≈ (CPU Cores × 2) + Effective Spindle Count. I would then validate and tune the pool size through load testing and actual connection-utilization metrics.


# Answer 2:
With 1,000 recruiters generating 12 writes per minute each, the workload is 1,000 × 12 = 12,000 writes/minute, or 200 writes/second. Each write holds a connection for 40 ms (0.04 seconds). Therefore, the minimum pool size is 200 × 0.04 = 8 connections. So 8 connections is the theoretical minimum to handle the stated workload without queuing, before adding any safety headroom.

Total writes/minute = 1,000 × 12
                    = 12,000 writes/minute

Writes/second = 12,000 ÷ 60
              = 200 writes/second

40 ms = 0.04 seconds

Minimum pool size = 200 × 0.04
                  = 8 connections


# Answer 3:
Here are some distinct solutions with their trade-offs
1. Increase worker concurrency
   Allow each stats worker process to process multiple jobs concurrently.
   Pros: Simple and inexpensive; improves throughput if jobs are I/O-bound.
   Trade-off: Higher concurrency increases CPU, memory, database connections, and downstream load.

2. Add more worker instances
   Run multiple stats-worker processes/instances consuming the same queue.
   Pros: Horizontal scaling and better fault isolation.
   Trade-off: More infrastructure/resources and potentially more load on the database or downstream systems.
    
stats-updates
      │
 ┌────┼────┐
 ▼    ▼    ▼
 W1   W2   W3


3. Batch stats updates
 Instead of updating statistics for every job individually, accumulate multiple updates and write them in batches.

Pros: Reduces database operations and can significantly improve throughput.
Trade-off: Statistics become slightly delayed/eventually consistent, and the implementation becomes more complex.


# Answer 4:
If the read replica is 2 seconds behind, a recruiter may successfully submit an application to the primary but not see it immediately when refreshing because the subsequent read may reach the stale replica. I would keep the replica for normal read traffic but use read-after-write consistency: after a successful write, route the user's immediate reads to the primary for a short period, or until the replica has caught up. This prevents stale results without removing the read replica.
Read replicas are asynchronous in many MySQL configurations, so a recently written record may not immediately appear on a replica.

For example:
Create application
       │
       ▼
Primary DB
       │
       ▼
Immediately fetch created application
       │
       ▼
Read from Primary


# 5. Biggest Architechtural risk
The biggest architechtural risk is the dependency between the database transaction and Redis job dispatch. An application can be successfully persisted while Redis is temporarily unavailable, leaving the application stored but its notification, stats, or audit jobs undispatched. With another day, I would implement the Transactional Outbox Pattern, where the application and an outbox event are committed in the same database transaction and a separate process reliably publishes the event to BullMQ/Redis. This would prevent background jobs from being lost when Redis is temporarily unavailable.
Here the outbox will work as safety record , like this application was created, but it background work
still needs to be processed.