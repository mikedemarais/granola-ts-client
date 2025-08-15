#!/usr/bin/env bun

/**
 * Example demonstrating token extraction with WorkOS/Cognito migration support.
 * This example shows how to extract tokens from the Granola desktop app
 * and handle both the new WorkOS tokens and legacy Cognito tokens.
 */

import GranolaClient from "granola-ts-client";
import { extractGranolaToken } from "granola-ts-client/utils";

async function main() {
	try {
		console.info("🔍 Searching for Granola authentication token...\n");

		// Extract token with automatic WorkOS/Cognito detection
		const tokenInfo = await extractGranolaToken();

		if (!tokenInfo) {
			console.error("❌ No Granola token found.");
			console.error(
				"Please ensure the Granola desktop app is installed and you're logged in.",
			);
			console.error("\nTo install Granola: https://granola.ai/download");
			process.exit(1);
		}

		// Display token information
		console.info(`✅ Found ${tokenInfo.tokenType.toUpperCase()} token`);
		console.info(
			`📊 Token status: ${tokenInfo.isValid ? "Valid" : "Expired/Invalid"}`,
		);

		if (tokenInfo.expiresAt) {
			const expiresIn = Math.round(
				(tokenInfo.expiresAt - Date.now()) / 1000 / 60,
			);
			if (expiresIn > 0) {
				console.info(`⏰ Expires in: ${expiresIn} minutes`);
			} else {
				console.info(`⏰ Expired: ${Math.abs(expiresIn)} minutes ago`);
			}
		}

		// Check if token is valid before using
		if (!tokenInfo.isValid) {
			console.warn("\n⚠️  Token appears to be expired or invalid.");
			console.warn(
				"Please open the Granola desktop app to refresh your authentication.",
			);
			process.exit(1);
		}

		// Use the token with the Granola client
		console.info("\n🚀 Initializing Granola client...");
		const client = new GranolaClient(tokenInfo.accessToken);

		// Test the connection
		console.info("📡 Testing API connection...");
		const workspaces = await client.v1_get_workspaces();
		const workspaceCount = workspaces.workspaces?.length ?? 0;

		console.info(
			`✅ Successfully connected! Found ${workspaceCount} workspace(s)\n`,
		);

		// Display workspace information
		if (workspaces.workspaces && workspaces.workspaces.length > 0) {
			console.info("📁 Your workspaces:");
			for (const ws of workspaces.workspaces) {
				if (ws.workspace) {
					console.info(
						`  - ${ws.workspace.name} (${ws.workspace.workspace_id})`,
					);
				}
			}
		}
	} catch (error) {
		console.error("\n❌ Error:", error);
		process.exit(1);
	}
}

// Run the example
main();
