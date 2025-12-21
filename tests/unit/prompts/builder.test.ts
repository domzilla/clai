import { PromptBuilder } from '../../../src/prompts/builder.js';
import type { SystemInfo } from '../../../src/system/detector.js';

describe('PromptBuilder', () => {
  let builder: PromptBuilder;
  const mockSystemInfo: SystemInfo = {
    os: 'macos',
    osVersion: 'Darwin 23.0.0',
    shell: 'zsh',
    shellPath: '/bin/zsh',
    platform: 'darwin',
    arch: 'arm64',
    cwd: '/Users/test/projects',
    homeDir: '/Users/test'
  };

  beforeEach(() => {
    builder = new PromptBuilder();
  });

  describe('buildSystemPrompt', () => {
    it('should include OS information', () => {
      const prompt = builder.buildSystemPrompt(mockSystemInfo, 3);

      expect(prompt).toContain('macos');
      expect(prompt).toContain('Darwin 23.0.0');
    });

    it('should include shell information', () => {
      const prompt = builder.buildSystemPrompt(mockSystemInfo, 3);

      expect(prompt).toContain('zsh');
    });

    it('should include current working directory', () => {
      const prompt = builder.buildSystemPrompt(mockSystemInfo, 3);

      expect(prompt).toContain('/Users/test/projects');
    });

    it('should include command count', () => {
      const prompt = builder.buildSystemPrompt(mockSystemInfo, 5);

      expect(prompt).toContain('5');
    });

    it('should include JSON response format instructions', () => {
      const prompt = builder.buildSystemPrompt(mockSystemInfo, 3);

      expect(prompt).toContain('JSON');
      expect(prompt).toContain('commands');
    });

    it('should include risk level definitions', () => {
      const prompt = builder.buildSystemPrompt(mockSystemInfo, 3);

      expect(prompt).toContain('low');
      expect(prompt).toContain('medium');
      expect(prompt).toContain('high');
    });
  });

  describe('buildUserPrompt', () => {
    it('should include user request', () => {
      const prompt = builder.buildUserPrompt('list all files');

      expect(prompt).toContain('list all files');
    });

    it('should handle special characters in request', () => {
      const prompt = builder.buildUserPrompt('find files matching "*.ts"');

      expect(prompt).toContain('find files matching "*.ts"');
    });

    it('should handle multi-line requests', () => {
      const request = 'create a file\nwith multiple lines';
      const prompt = builder.buildUserPrompt(request);

      expect(prompt).toContain('create a file\nwith multiple lines');
    });
  });

  describe('prompt structure', () => {
    it('should create complete prompts for different systems', () => {
      const windowsInfo: SystemInfo = {
        os: 'windows',
        osVersion: 'Windows NT 10.0',
        shell: 'powershell',
        shellPath: 'powershell.exe',
        platform: 'win32',
        arch: 'x64',
        cwd: 'C:\\Users\\test',
        homeDir: 'C:\\Users\\test'
      };

      const prompt = builder.buildSystemPrompt(windowsInfo, 3);

      expect(prompt).toContain('windows');
      expect(prompt).toContain('powershell');
      expect(prompt).toContain('C:\\Users\\test');
    });

    it('should work with Linux system info', () => {
      const linuxInfo: SystemInfo = {
        os: 'linux',
        osVersion: 'Linux 5.15.0',
        shell: 'bash',
        shellPath: '/bin/bash',
        platform: 'linux',
        arch: 'x64',
        cwd: '/home/user',
        homeDir: '/home/user'
      };

      const prompt = builder.buildSystemPrompt(linuxInfo, 3);

      expect(prompt).toContain('linux');
      expect(prompt).toContain('bash');
      expect(prompt).toContain('/home/user');
    });
  });
});
