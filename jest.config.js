module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/server/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  testPathIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: ['server/**/*.js', 'control/**/*.js', '!node_modules/**', '!**/*.test.js'],
  verbose: true,
  testTimeout: 10000,
};
