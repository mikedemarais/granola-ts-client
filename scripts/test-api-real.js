import { GranolaClient } from '../src/client.js';

// Test API call to get workspaces
async function testApiConnection() {
  try {
    // Use the provided token
    const accessToken = 'eyJraWQiOiJvU1ZkY0xmY0tMYmJaMEsyVG9Cdzg4ZVwvRGgzYlY3eVFweW1LWU1nVWt1bz0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI2ZDc3MTc3Yi1kYTQ5LTQzNjgtYWFmNi1jZGE4MTgzNGQwNDQiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb21cL3VzLWVhc3QtMV8zZE9PeU5xMTYiLCJjbGllbnRfaWQiOiIxM2g2cG9tYmpobGEwZHJzMHBsNHE0Y3U1NiIsIm9yaWdpbl9qdGkiOiJkZmU5YTRkMC03ZDQ4LTRlNTgtOWM0Ny1mNGM0Y2FmN2U2ZjUiLCJldmVudF9pZCI6IjljZjExMmNjLWJmODgtNDNiZC1iOTM1LTQ2MzcyNTRlZmM3NCIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE3MzgyMTQ2MTYsImV4cCI6MTc0Nzc5NzA2MiwiaWF0IjoxNzQ3NzEwNjYyLCJqdGkiOiIyZDg3NzJmMS1kNGQ4LTQyMzUtOTBjYy1mNjRiOGY1MDllMjEiLCJ1c2VybmFtZSI6ImI2ZWQwZjBmLTJlZGItNGYxZi1iNDljLTRmYmY1M2U2Y2FmYyJ9.NeRzqZTuixx4v7-WjLPS6FbzhBJaBPf24dtH99dIc2tFrOZMGMRKS4V7zlB72-vmtSUxtiFbXGSBtMIoph-I7qo9MrcKXAONj9DOfsfS1mWdRgxQMJF6XEiKx8w7NiTiXMyeb5DX1tQT2ECCSOJoHRUNdjQ-H7QqIBiJDK6HOYYC36ufsllsPysGQMXLfCkb0l4R8PDjYypoZFPxLFWJA7wimLrYiO75lGobHxNeZE_J48Ee5THD8HgHJuyEWXS32OPWyIwCB1LQ_H411D4PTTucpI-Hxo2DUbzoXcWfrlC7HIqRon9y13RTJL2OYSGMSL-5jg6vghA6bBQrFFw73g';
    
    // Create the client with the token
    // Using client mimicking is now the default behavior
    console.log('Creating Granola client...');
    const client = new GranolaClient(accessToken);
    
    // Fetch workspaces
    console.log('Fetching workspaces from Granola API...');
    const workspaces = await client.getWorkspaces();
    
    // Log the results
    console.log('\nSuccess! Received response:');
    console.log(JSON.stringify(workspaces, null, 2));
    
    // Print a summary of the workspaces
    const count = workspaces.workspaces?.length || 0;
    console.log(`\nFound ${count} workspace(s)`);
    
    if (count > 0) {
      console.log('\nWorkspace summary:');
      workspaces.workspaces.forEach((workspace, index) => {
        console.log(`${index + 1}. ${workspace.workspace.display_name} (${workspace.workspace.workspace_id})`);
        console.log(`   Role: ${workspace.role}`);
        console.log(`   Plan: ${workspace.plan_type}`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('\nError fetching workspaces:');
    console.error(error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    return false;
  }
}

// Run the test
console.log('=== Granola API Connection Test ===\n');
testApiConnection().then(success => {
  console.log(`\n=== Test ${success ? 'PASSED' : 'FAILED'} ===`);
  process.exit(success ? 0 : 1);
});