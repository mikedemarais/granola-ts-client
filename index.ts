import GranolaClient from './src/index';

// Example usage of the client
async function main() {
  try {
    // Make sure GRANOLA_TOKEN is set in your environment or .env file
    const client = new GranolaClient();
    
    // Get workspaces
    const workspaces = await client.getWorkspaces();
    console.log(`Found ${workspaces.workspaces.length} workspaces`);
    
    // Get documents from the first workspace
    if (workspaces.workspaces.length > 0) {
      const workspaceId = workspaces.workspaces[0].workspace.workspace_id;
      const docs = await client.getDocuments({ workspace_id: workspaceId, limit: 5 });
      
      console.log(`First 5 documents in workspace ${workspaceId}:`);
      if (docs.docs && docs.docs.length > 0) {
        docs.docs.forEach(doc => {
          console.log(`- ${doc.title} (${doc.id})`);
        });
      } else {
        console.log('No documents found');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
main();