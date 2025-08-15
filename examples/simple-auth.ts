#!/usr/bin/env bun

/**
 * Simple example showing automatic token extraction from Granola desktop app.
 * Works with both WorkOS (new) and Cognito (legacy) authentication.
 */

import GranolaClient from "granola-ts-client";
import { extractGranolaToken } from "granola-ts-client/utils";

async function main() {
	// Automatically extract token from Granola desktop app
	const tokenInfo = await extractGranolaToken();

	if (!tokenInfo || !tokenInfo.isValid) {
		console.error(
			"No valid Granola token found. Please log into the desktop app.",
		);
		process.exit(1);
	}

	console.info(`Using ${tokenInfo.tokenType} authentication`);

	// Initialize client with extracted token
	const client = new GranolaClient(tokenInfo.accessToken);

	// Fetch and display workspaces
	const workspaces = await client.v1_get_workspaces();
	console.info(`Found ${workspaces.workspaces?.length ?? 0} workspaces`);

	// Get documents from first workspace
	if (workspaces.workspaces?.[0]?.workspace) {
		const workspaceId = workspaces.workspaces[0].workspace.workspace_id;
		const docs = await client.v2_get_documents({
			workspace_id: workspaceId,
			limit: 5,
		});

		console.info(
			`\nRecent documents in "${workspaces.workspaces[0].workspace.name}":`,
		);
		for (const doc of docs.docs ?? []) {
			console.info(`- ${doc.title}`);
		}
	}
}

main().catch(console.error);
