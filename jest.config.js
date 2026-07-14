module.exports = {
  rootDir: __dirname,
  preset: 'jest-preset-angular',
  modulePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/package.json',
  ],
  moduleNameMapper: {
    '@rb-mwindh/ngx-theme-manager$':
      '<rootDir>/projects/ngx-theme-manager/src/public-api.ts',
    '@rb-mwindh/ngx-theme-manager/(.*)$':
      '<rootDir>/projects/ngx-theme-manager/src/lib/$1',
  },
  collectCoverage: true,
  coverageReporters: ['lcovonly', 'text'],
  // coverageThreshold: {
  //   global: {
  //     branches: 100,
  //     functions: 100,
  //     lines: 100,
  //     statements: 100,
  //   },
  // },
};
