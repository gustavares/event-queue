/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  // The suite runs against a real Postgres and truncates between tests, so workers
  // must not run in parallel against the same database.
  maxWorkers: 1,
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testTimeout: 20000,
};
