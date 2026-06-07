// Runs before any module is imported. Provides the env vars that
// env.config validates at import time, so tests never trigger its
// process.exit, and never touch a real MongoDB/Redis.
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.MONGO_URI = 'mongodb://localhost:27017/category-test';
process.env.REDIS_URL = 'redis://localhost:6379';
