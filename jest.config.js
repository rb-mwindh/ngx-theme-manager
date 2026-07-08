module.exports = {
  preset: 'jest-preset-angular',
  moduleNameMapper: {
    '@rb-mwindh/ngx-theme-manager':
      '<rootDir>/projects/ngx-theme-manager/src/public-api.ts',
  },
  modulePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/package.json',
  ],
  collectCoverage: true,
  coverageReporters: ['lcovonly', 'text'],
};
