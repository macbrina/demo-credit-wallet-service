module.exports = {
  maxWorkers: 1,
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
  moduleFileExtensions: ["ts", "js", "json", "node"],
  coverageDirectory: "<rootDir>/coverage",
  collectCoverageFrom: ["src/**/*.{ts,js}", "!src/**/*.d.ts"],
  testPathIgnorePatterns: ["<rootDir>/dist/"],
};
