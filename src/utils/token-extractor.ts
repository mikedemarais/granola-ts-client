/**
 * Optional token extraction utilities for Granola desktop app.
 *
 * NOTE: These utilities are Node.js/Bun specific and will not work in browsers.
 * They are provided as optional helpers for Node.js applications.
 * The main granola-ts-client library does not depend on these utilities.
 *
 * Usage:
 * ```ts
 * import { extractGranolaToken } from 'granola-ts-client/utils';
 * const tokenInfo = await extractGranolaToken();
 * ```
 */

// Only available in Node.js/Bun environments
const isNode = typeof process !== "undefined" && process.versions?.node;
const isBun = typeof Bun !== "undefined";

export interface TokenInfo {
	/** The access token */
	accessToken: string;
	/** Token type: 'workos' or 'cognito' */
	tokenType: "workos" | "cognito";
	/** When the token expires (Unix timestamp in milliseconds) */
	expiresAt?: number;
	/** Whether the token is likely still valid */
	isValid: boolean;
}

/**
 * Extract Granola access token from the desktop app's local storage.
 * Supports both WorkOS (new) and Cognito (legacy) authentication.
 *
 * @returns Token information or null if not found
 * @throws Error if called in a browser environment
 */
export async function extractGranolaToken(): Promise<TokenInfo | null> {
	if (!isNode && !isBun) {
		throw new Error(
			"Token extraction is only available in Node.js/Bun environments",
		);
	}

	// biome-ignore lint/style/useNodejsImportProtocol: Dynamic require for optional functionality
	const fs = require("fs");
	// biome-ignore lint/style/useNodejsImportProtocol: Dynamic require for optional functionality
	const os = require("os");
	// biome-ignore lint/style/useNodejsImportProtocol: Dynamic require for optional functionality
	const path = require("path");

	const configPath =
		process.platform === "darwin"
			? path.join(
					os.homedir(),
					"Library/Application Support/Granola/supabase.json",
				)
			: path.join(os.homedir(), ".config/Granola/supabase.json");

	if (!fs.existsSync(configPath)) {
		return null;
	}

	try {
		const fileContent = fs.readFileSync(configPath, "utf-8");
		const data = JSON.parse(fileContent);

		// Try WorkOS tokens first (new auth system)
		if (data.workos_tokens) {
			try {
				const tokens = JSON.parse(data.workos_tokens);
				if (tokens.access_token && tokens.access_token !== "null") {
					const expiresAt =
						tokens.obtained_at && tokens.expires_in
							? tokens.obtained_at + tokens.expires_in * 1000
							: undefined;

					return {
						accessToken: tokens.access_token,
						tokenType: "workos",
						expiresAt,
						isValid: isTokenLikelyValid(tokens.access_token),
					};
				}
			} catch {
				// Continue to Cognito tokens
			}
		}

		// Fall back to Cognito tokens (legacy)
		if (data.cognito_tokens) {
			try {
				const tokens = JSON.parse(data.cognito_tokens);
				if (tokens.access_token && tokens.access_token !== "null") {
					const expiresAt =
						tokens.obtained_at && tokens.expires_in
							? tokens.obtained_at + tokens.expires_in * 1000
							: undefined;

					return {
						accessToken: tokens.access_token,
						tokenType: "cognito",
						expiresAt,
						isValid: isTokenLikelyValid(tokens.access_token),
					};
				}
			} catch {
				// Token extraction failed
			}
		}

		return null;
	} catch {
		return null;
	}
}

/**
 * Check if a JWT token is likely still valid based on its expiration time.
 * Works in all environments (browser, Node.js, Bun).
 *
 * @param token - The JWT token to validate
 * @param bufferMinutes - Minutes before expiration to consider token invalid (default: 5)
 * @returns Whether the token appears to be valid
 */
export function isTokenLikelyValid(token: string, bufferMinutes = 5): boolean {
	try {
		const parts = token.split(".");
		if (parts.length !== 3) return false;

		// Decode JWT payload (base64url)
		let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
		while (base64.length % 4) {
			base64 += "=";
		}

		// Use appropriate decoding method based on environment
		let payload: any;
		if (typeof Buffer !== "undefined") {
			// Node.js/Bun environment
			payload = JSON.parse(Buffer.from(base64, "base64").toString());
		} else if (typeof atob !== "undefined") {
			// Browser environment
			payload = JSON.parse(atob(base64));
		} else {
			return false; // Can't decode in this environment
		}

		// Check expiration
		if (payload.exp) {
			const expirationTime = payload.exp * 1000; // Convert to milliseconds
			const now = Date.now();
			const bufferTime = bufferMinutes * 60 * 1000;

			if (now >= expirationTime - bufferTime) {
				return false; // Token expired or expiring soon
			}
		}

		return true;
	} catch {
		return false; // Can't decode = assume invalid
	}
}
