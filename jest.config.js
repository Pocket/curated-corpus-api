module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|integration).ts'],
  testPathIgnorePatterns: ['/dist/'],
  testTimeout: 500000,
  globalSetup: '<rootDir>/src/test/setup/jest.setup.js',
  globalTeardown: '<rootDir>/src/test/setup/jest.teardown.js',
};
