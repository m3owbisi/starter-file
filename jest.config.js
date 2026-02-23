/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/styleMock.js",
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/__mocks__/fileMock.js",
  },
  transform: {
    "^.+\\.(ts|tsx|js|jsx)$": [
      "babel-jest",
      {
        presets: ["next/babel"],
      },
    ],
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(lucide-react)/)",
  ],
  maxWorkers: 1,
  testMatch: ["<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)"],
};
