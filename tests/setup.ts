import { beforeAll, afterAll } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/piki_food_test?schema=public';
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.REDIS_URL = 'redis://localhost:6379';

// Set up any global test fixtures here
beforeAll(async () => {
  // Prisma connection will be established per test file
});

afterAll(async () => {
  // Cleanup
});
