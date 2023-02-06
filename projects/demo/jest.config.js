module.exports = {
  coverageDirectory: '<rootDir>/coverage/demo',
  coveragePathIgnorePatterns: ['/ngx-theme-manager/', '/node_modules/'],
  collectCoverageFrom: [
    '<rootDir>/projects/demo/src/app/**/*.ts',
    '!**/index.ts',
  ],
};
