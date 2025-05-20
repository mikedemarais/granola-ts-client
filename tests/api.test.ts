import { describe, it, expect } from 'bun:test';
import { GranolaClient } from '../src/client';

// This is a manual test that can be run to verify API connectivity
// Not included in automated tests because it requires a valid token
describe('API connectivity (manual test)', () => {
  it('should fetch workspaces from the Granola API', async () => {
    // Skip this test in automated test runs
    if (process.env.CI) {
      console.log('Skipping API connectivity test in CI environment');
      return;
    }

    try {
      // This token would be replaced with your own token when testing manually
      const token = 'your-token-here';
      
      const client = new GranolaClient(token);
      const workspaces = await client.getWorkspaces();
      
      expect(workspaces).toBeDefined();
      expect(workspaces.workspaces).toBeDefined();
      expect(Array.isArray(workspaces.workspaces)).toBeTruthy();
    } catch (error) {
      // Only fail if this is being run manually
      if (!process.env.CI) {
        console.error('API test failed:', error);
        throw error;
      }
    }
  });
});