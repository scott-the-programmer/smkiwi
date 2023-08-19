const esModules = ["d3", "d3-array", "other-d3-module-if-needed"].join("|");

module.exports = {
  preset: "ts-jest",
  testEnvironment: "jest-environment-jsdom",
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  moduleNameMapper: {
    "\\.(css|less|sass|scss)$": "<rootDir>/src/styleMock.js",
    "^d3$": "<rootDir>/node_modules/d3/dist/d3.min.js",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};
