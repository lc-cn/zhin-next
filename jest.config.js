/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\.tsx?$": ["ts-jest",{}],
  },
  // 只匹配 .test.[c|m]?[t|j]s 格式的测试文件
  testMatch: [
    "**/*.test.[jt]s",
    "**/*.test.[cm][jt]s"
  ],
  // 排除不需要测试的目录
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/example/"
  ],
  // 收集测试覆盖率时排除的文件
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/example/",
    "/tests/"
  ]
};