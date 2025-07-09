import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';

describe('CLI init命令测试', () => {
  let tempDir: string;
  let originalCwd: string;
  let cliPath: string;
  
  beforeAll(() => {
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zhin-cli-test-'));
    
    // CLI 路径需要从构建后的dist目录获取
    cliPath = path.join(originalCwd, 'packages/cli/dist/cli.js');
  });
  
  afterAll(() => {
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('项目创建', () => {
    test('应该能创建YAML配置的项目', () => {
      const projectName = 'test-yaml-project';
      const projectPath = path.join(tempDir, projectName);
      
      // 执行 init 命令
      execSync(`node "${cliPath}" init ${projectName} --config yaml`, {
        cwd: tempDir,
        stdio: 'pipe'
      });
      
      // 验证项目结构
      expect(fs.existsSync(projectPath)).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'package.json'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'zhin.config.yaml'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, '.env.example'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'src'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'src/index.ts'))).toBe(true);
      
      // 验证配置文件内容
      const configContent = fs.readFileSync(path.join(projectPath, 'zhin.config.yaml'), 'utf-8');
      expect(configContent).toContain('bots:');
      expect(configContent).toContain('plugin_dirs:');
      expect(configContent).toContain('plugins:');
      expect(configContent).toContain('- ./src/plugins');
      expect(configContent).toContain('- node_modules');
    });

    test('应该能创建JSON配置的项目', () => {
      const projectName = 'test-json-project';
      const projectPath = path.join(tempDir, projectName);
      
      execSync(`node "${cliPath}" init ${projectName} --config json`, {
        cwd: tempDir,
        stdio: 'pipe'
      });
      
      expect(fs.existsSync(path.join(projectPath, 'zhin.config.json'))).toBe(true);
      
      const configContent = fs.readFileSync(path.join(projectPath, 'zhin.config.json'), 'utf-8');
      const config = JSON.parse(configContent);
      
      expect(config.bots).toBeDefined();
      expect(config.plugin_dirs).toEqual(['${PLUGIN_DIR:-./src/plugins}', 'node_modules']);
      expect(config.plugins).toEqual(['onebot11', 'test-plugin']);
    });

    test('应该能创建TOML配置的项目', () => {
      const projectName = 'test-toml-project';
      const projectPath = path.join(tempDir, projectName);
      
      execSync(`node "${cliPath}" init ${projectName} --config toml`, {
        cwd: tempDir,
        stdio: 'pipe'
      });
      
      expect(fs.existsSync(path.join(projectPath, 'zhin.config.toml'))).toBe(true);
      
      const configContent = fs.readFileSync(path.join(projectPath, 'zhin.config.toml'), 'utf-8');
      expect(configContent).toContain('[[bots]]');
      expect(configContent).toContain('plugin_dirs = ["${PLUGIN_DIR:-./src/plugins}", "node_modules"]');
      expect(configContent).toContain('plugins = ["onebot11", "test-plugin"]');
    });
  });

  describe('错误处理', () => {
    test('应该拒绝无效的配置格式', () => {
      const projectName = 'test-invalid-config';
      
      expect(() => {
        execSync(`node "${cliPath}" init ${projectName} --config invalid`, {
          cwd: tempDir,
          stdio: 'pipe'
        });
      }).toThrow();
    });

    test('应该拒绝已存在的项目目录', () => {
      const projectName = 'existing-project';
      const projectPath = path.join(tempDir, projectName);
      
      // 先创建目录
      fs.mkdirSync(projectPath);
      
      expect(() => {
        execSync(`node "${cliPath}" init ${projectName}`, {
          cwd: tempDir,
          stdio: 'pipe'
        });
      }).toThrow();
    });
  });

  describe('模板内容验证', () => {
    test('生成的package.json应该包含正确的依赖', () => {
      const projectName = 'test-package-json';
      const projectPath = path.join(tempDir, projectName);
      
      execSync(`node "${cliPath}" init ${projectName}`, {
        cwd: tempDir,
        stdio: 'pipe'
      });
      
      const packageJsonContent = fs.readFileSync(path.join(projectPath, 'package.json'), 'utf-8');
      const packageJson = JSON.parse(packageJsonContent);
      
      expect(packageJson.name).toBe(projectName);
      expect(packageJson.dependencies).toHaveProperty('@zhin/core');
      expect(packageJson.devDependencies).toHaveProperty('@zhin/cli');
      expect(packageJson.scripts).toHaveProperty('dev');
      expect(packageJson.scripts).toHaveProperty('build');
      expect(packageJson.scripts).toHaveProperty('start');
    });

    test('生成的环境变量文件应该包含必要的变量', () => {
      const projectName = 'test-env-file';
      const projectPath = path.join(tempDir, projectName);
      
      execSync(`node "${cliPath}" init ${projectName}`, {
        cwd: tempDir,
        stdio: 'pipe'
      });
      
      const envContent = fs.readFileSync(path.join(projectPath, '.env.example'), 'utf-8');
      
      expect(envContent).toContain('ONEBOT_URL');
      expect(envContent).toContain('ONEBOT_ACCESS_TOKEN');
    });

    test('生成的主文件应该使用配置文件', () => {
      const projectName = 'test-main-file';
      const projectPath = path.join(tempDir, projectName);
      
      execSync(`node "${cliPath}" init ${projectName}`, {
        cwd: tempDir,
        stdio: 'pipe'
      });
      
      const indexContent = fs.readFileSync(path.join(projectPath, 'src/index.ts'), 'utf-8');
      
      expect(indexContent).toContain('new Bot()');
      expect(indexContent).not.toContain('createAdapter');
    });
  });
}); 