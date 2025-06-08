import GranolaClient from "../src/index";

// Example usage of the client
async function main() {
	try {
		const token = process.env.GRANOLA_ACCESS_TOKEN;
		if (!token) {
			throw new Error("GRANOLA_ACCESS_TOKEN env var not set");
		}
		const client = new GranolaClient(token);

		// Get workspaces
		const workspaces = await client.getWorkspaces();
		const workspaceCount = workspaces.workspaces?.length ?? 0;
		console.log(`Found ${workspaceCount} workspaces`);

		// Get documents from the first workspace
		if (workspaces.workspaces && workspaces.workspaces.length > 0) {
			const firstWorkspace = workspaces.workspaces[0];
			if (firstWorkspace.workspace) {
				const workspaceId = firstWorkspace.workspace.workspace_id;
				const docs = await client.getDocuments({
					workspace_id: workspaceId,
					limit: 5,
				});

				console.log(`First 5 documents in workspace ${workspaceId}:`);
				if (docs.docs && docs.docs.length > 0) {
					for (const doc of docs.docs) {
						console.log(`- ${doc.title} (${doc.id})`);
					}
				} else {
					console.log("No documents found");
				}
			}
		}
	} catch (error) {
		console.error("Error:", error);
	}
}

// Run the example
main();
