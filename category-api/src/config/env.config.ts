import dotenv from 'dotenv';
dotenv.config();

const REQUIRED_VARS = ['PORT', 'MONGO_URI', 'REDIS_URL'] as const;

const validateEnv = (): void => {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error('Missing environment variables:');
    missing.forEach((key) => console.error(`  -> ${key}`));
    process.exit(1);
  }
};

validateEnv();

export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI as string,
  redisUrl: process.env.REDIS_URL as string,
  cache: {
    ttlAll: Number(process.env.CACHE_TTL_ALL) || 300,
    ttlSingle: Number(process.env.CACHE_TTL_SINGLE) || 600,
  },
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
};
