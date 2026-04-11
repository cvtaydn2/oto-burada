const Redis = require("ioredis");

const redisUrl = "redis://default:kbkgaxjrgX1IGVTTQyLOoDgRKfhJCAcg@redis-16657.c89.us-east-1-3.ec2.cloud.redislabs.com:16657";
const redis = new Redis(redisUrl);

async function testConnection() {
  try {
    console.log("Connecting to Redis...");
    await redis.set("test_key", "OtoBurada Connection OK: " + new Date().toISOString());
    const val = await redis.get("test_key");
    console.log("Redis Response:", val);
    process.exit(0);
  } catch (err) {
    console.error("Redis Connection Failed:", err);
    process.exit(1);
  }
}

testConnection();
