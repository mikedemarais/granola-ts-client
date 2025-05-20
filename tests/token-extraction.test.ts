import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { GranolaClient } from '../src/client';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

// This test checks token extraction functionality by creating a mock supabase.json file
describe('Token extraction', () => {
  // Create paths for the test
  const homedir = os.homedir();
  const platform = os.platform();
  
  // Determine the expected path based on platform
  let granolaDir: string;
  switch(platform) {
    case 'darwin': // macOS
      granolaDir = path.join(homedir, 'Library/Application Support/Granola');
      break;
    case 'win32': // Windows
      granolaDir = path.join(homedir, 'AppData/Roaming/Granola');
      break;
    case 'linux': // Linux
      granolaDir = path.join(homedir, '.config/Granola');
      break;
    default:
      granolaDir = path.join(homedir, 'Library/Application Support/Granola');
  }
  
  const testDir = path.join(os.tmpdir(), 'granola-test');
  const mockSupabaseFile = path.join(testDir, 'supabase.json');
  const originalGranolaDir = granolaDir;
  
  // Create mock data
  const mockTokens = {
    access_token: 'mock-access-token-for-testing',
    refresh_token: 'mock-refresh-token-for-testing'
  };
  
  const mockSupabaseData = {
    cognito_tokens: JSON.stringify(mockTokens)
  };

  // Setup/teardown hooks to create and clean up mock files
  beforeAll(() => {
    // Skip file operations in CI environment
    if (process.env.CI) return;
    
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Create mock supabase.json file
    fs.writeFileSync(mockSupabaseFile, JSON.stringify(mockSupabaseData));
  });
  
  afterAll(() => {
    // Skip cleanup in CI environment
    if (process.env.CI) return;
    
    // Clean up test files
    if (fs.existsSync(mockSupabaseFile)) {
      fs.unlinkSync(mockSupabaseFile);
    }
    
    if (fs.existsSync(testDir)) {
      fs.rmdirSync(testDir);
    }
  });
  
  it('should extract tokens from supabase.json', async () => {
    // Skip in CI environment
    if (process.env.CI) {
      console.log('Skipping token extraction test in CI environment');
      return;
    }
    
    try {
      // Mock the homedir function to return our test directory
      const originalHomedir = os.homedir;
      os.homedir = () => testDir;
      
      const { accessToken, refreshToken } = await GranolaClient.getAuthTokens();
      
      // Restore original homedir function
      os.homedir = originalHomedir;
      
      // Verify the extracted tokens
      expect(accessToken).toBe(mockTokens.access_token);
      expect(refreshToken).toBe(mockTokens.refresh_token);
    } catch (error) {
      // Restore original homedir function
      os.homedir = os.homedir;
      throw error;
    }
  });
  
  it('should handle missing supabase.json file', async () => {
    // Skip in CI environment
    if (process.env.CI) {
      console.log('Skipping token extraction error test in CI environment');
      return;
    }
    
    // Mock the homedir function to return a non-existent directory
    const originalHomedir = os.homedir;
    os.homedir = () => path.join(os.tmpdir(), 'non-existent-dir');
    
    try {
      await GranolaClient.getAuthTokens();
      // If we get here, the test should fail
      expect(true).toBe(false); // This should never execute
    } catch (error) {
      // Verify error is thrown
      expect(error).toBeDefined();
      expect((error as Error).message).toContain('Granola token file not found');
    } finally {
      // Restore original homedir function
      os.homedir = originalHomedir;
    }
  });
});