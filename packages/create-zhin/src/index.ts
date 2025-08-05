#!/usr/bin/env node

import { spawn } from 'child_process';


// 直接调用 CLI 的 init 命令
const args = process.argv.slice(2);
const initArgs = ['init', ...args];

const child = spawn('npx', ['zhin init', ...initArgs], {
  stdio: 'inherit',
  cwd: process.cwd()
});

child.on('close', (code) => {
  process.exit(code || 0);
});

child.on('error', (error) => {
  console.error('Failed to zhin init:', error);
  process.exit(1);
}); 