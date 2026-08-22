import dotenv from "dotenv";

dotenv.config();

const config = {
  port: Number(process.env.PORT) || 5000,

  nodeEnv: process.env.NODE_ENV || "development",
  redisUrl: process.env.REDIS_URL || "",

};

export default config;