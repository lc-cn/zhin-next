import { spawn } from 'child_process';
import { getProcessStatus, getProcessStatusDetailed, getRelatedProcesses } from '../src/utils/process.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('进程管理功能测试', () => {
  let testPid: number;
  let testDir: string;

  beforeAll(async () => {
    // 创建测试目录
    testDir = path.join(os.tmpdir(), 'zhin-process-test');
    await fs.ensureDir(testDir);
  });

  afterAll(async () => {
    // 清理测试目录
    await fs.remove(testDir);
  });

  test('应该能检测到不存在的进程', async () => {
    const status = await getProcessStatus(testDir);
    expect(status.running).toBe(false);
    expect(status.pid).toBeUndefined();
  });

  test('应该能获取进程详细状态', async () => {
    const status = await getProcessStatusDetailed(testDir);
    expect(status.running).toBe(false);
    expect(status.pid).toBeUndefined();
    expect(status.info).toBeUndefined();
  });

  test('应该能获取相关进程列表', async () => {
    const processes = await getRelatedProcesses('node');
    expect(Array.isArray(processes)).toBe(true);
    
    // 检查进程信息结构
    if (processes.length > 0) {
      const process = processes[0];
      expect(process).toHaveProperty('pid');
      expect(process).toHaveProperty('name');
      expect(typeof process.pid).toBe('number');
      expect(typeof process.name).toBe('string');
    }
  });

  test('应该能处理无效的进程名称', async () => {
    const processes = await getRelatedProcesses('nonexistent-process-12345');
    expect(Array.isArray(processes)).toBe(true);
    expect(processes.length).toBe(0);
  });

  test('应该能处理跨平台命令', async () => {
    const platform = os.platform();
    
    if (platform === 'win32') {
      // Windows 测试
      const processes = await getRelatedProcesses('explorer');
      expect(Array.isArray(processes)).toBe(true);
    } else {
      // Linux/macOS 测试
      const processes = await getRelatedProcesses('systemd');
      expect(Array.isArray(processes)).toBe(true);
    }
  });
}); 