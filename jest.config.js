module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'server/**/*.js',
    'control/**/*.js',
    '!node_modules/**',
    '!**/*.test.js'
  ],
  verbose: true,
  testTimeout: 10000
};
