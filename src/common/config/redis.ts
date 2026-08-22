import IORedis from "ioredis";
import config from "./config";

const redis = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (error) => {
  console.error("Redis error:", error.message);
});

export default redis;