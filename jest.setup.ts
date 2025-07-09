// Jest 全局测试设置
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 设置测试环境变量
process.env.NODE_ENV = 'test';

// 设置全局测试配置
global.testTimeout = 10000;

// 控制台日志静默（可选）
// console.log = jest.fn();
// console.warn = jest.fn();
// console.error = jest.fn(); 