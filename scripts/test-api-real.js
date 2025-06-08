import { GranolaClient } from "../src/client.js";

// Test API call to get workspaces
async function testApiConnection() {
	try {
		console.log("Creating Granola client...");

		// Option 1: Auto-retrieve token from local Granola app (uncomment to use)
		const client = new GranolaClient();
		console.log("Using automatic token retrieval from local Granola app");

		// Option 2: Use explicit token (uncomment and replace with your token to use)
		// const accessToken = 'YOUR_TOKEN_HERE';
		// const client = new GranolaClient(accessToken);
		// console.log('Using provided access token');

		// Option 3: Manually extract tokens (uncomment to use)
		// console.log('Extracting tokens from local Granola app...');
		// const { accessToken } = await GranolaClient.getAuthTokens();
		// const client = new GranolaClient(accessToken);
		// console.log('Using manually extracted access token');

		// Fetch workspaces
		console.log("Fetching workspaces from Granola API...");
		const workspaces = await client.v1_get_workspaces();

		// Log the results
		console.log("\nSuccess! Received response:");
		console.log(JSON.stringify(workspaces, null, 2));

		// Print a summary of the workspaces
		const count = workspaces.workspaces?.length || 0;
		console.log(`\nFound ${count} workspace(s)`);

		if (count > 0) {
			console.log("\nWorkspace summary:");
			for (const [index, workspace] of workspaces.workspaces.entries()) {
				console.log(
					`${index + 1}. ${workspace.workspace.display_name} (${workspace.workspace.workspace_id})`,
				);
				console.log(`   Role: ${workspace.role}`);
				console.log(`   Plan: ${workspace.plan_type}`);
			}
		}

		return true;
	} catch (error) {
		console.error("\nError fetching workspaces:");
		console.error(error.message);
		if (error.response) {
			console.error("Response:", error.response);
		}
		return false;
	}
}

// Run the test
console.log("=== Granola API Connection Test ===\n");
testApiConnection().then((success) => {
	console.log(`\n=== Test ${success ? "PASSED" : "FAILED"} ===`);
	process.exit(success ? 0 : 1);
});
