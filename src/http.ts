import ky, { type KyInstance } from "ky";

export interface HttpOpts {
	timeout?: number;
	retries?: number;
	appVersion?: string;
	clientType?: string;
	clientPlatform?: string;
	clientArchitecture?: string;
	electronVersion?: string;
	chromeVersion?: string;
	nodeVersion?: string;
	osVersion?: string;
	osBuild?: string;
	clientHeaders?: Record<string, string>;
}

export class Http {
	private token?: string;
	private readonly baseUrl: string;
	private readonly timeout: number;
	private readonly retries: number;
	private readonly appVersion: string;
	private readonly clientType: string;
	private readonly clientPlatform: string;
	private readonly clientArchitecture: string;
	private readonly electronVersion: string;
	private readonly chromeVersion: string;
	private readonly nodeVersion: string;
	private readonly osVersion: string;
	private readonly osBuild: string;
	private readonly clientHeaders: Record<string, string>;
	private ky: KyInstance;

	constructor(
		token?: string,
		baseUrl = "https://api.granola.ai",
		opts: HttpOpts = {},
	) {
		this.token = token;
		this.baseUrl = baseUrl.replace(/\/+$/g, "");
		this.timeout = opts.timeout ?? 5000;
		this.retries = opts.retries ?? 3;
		this.appVersion = opts.appVersion ?? "6.4.0";
		this.clientType = opts.clientType ?? "electron";
		this.clientPlatform = opts.clientPlatform ?? "darwin";
		this.clientArchitecture = opts.clientArchitecture ?? "arm64";
		this.electronVersion = opts.electronVersion ?? "33.4.5";
		this.chromeVersion = opts.chromeVersion ?? "130.0.6723.191";
		this.nodeVersion = opts.nodeVersion ?? "20.18.3";
		this.osVersion = opts.osVersion ?? "15.3.1";
		this.osBuild = opts.osBuild ?? "24D70";
		this.clientHeaders = opts.clientHeaders ?? {};

		this.ky = ky.create({
			prefixUrl: this.baseUrl,
			timeout: this.timeout,
			retry: {
				limit: this.retries,
				methods: ["get", "post"],
				statusCodes: [408, 413, 429, 500, 502, 503, 504],
			},
			throwHttpErrors: false,
		});
	}

	public setToken(token: string): void {
		this.token = token;
	}

	private buildHeaders(contentType?: string): Record<string, string> {
		const headers: Record<string, string> = {};
		if (contentType) headers["Content-Type"] = contentType;
		if (contentType === "application/json") headers.Accept = "application/json";
		if (this.token) headers.Authorization = `Bearer ${this.token}`;
		headers["X-App-Version"] = this.appVersion;
		headers["User-Agent"] =
			`Granola/${this.appVersion} Electron/${this.electronVersion} ` +
			`Chrome/${this.chromeVersion} Node/${this.nodeVersion} (macOS ${this.osVersion} ${this.osBuild})`;
		headers["X-Client-Type"] = this.clientType;
		headers["X-Client-Platform"] = this.clientPlatform;
		headers["X-Client-Architecture"] = this.clientArchitecture;
		headers["X-Client-Id"] = `granola-${this.clientType}-${this.appVersion}`;
		Object.assign(headers, this.clientHeaders);
		return headers;
	}

	private async request<T>(
		method: "GET" | "POST",
		path: string,
		body?: unknown,
	): Promise<T> {
		const cleanPath = path.replace(/^\//, "");
		let lastError: unknown;
		for (let attempt = 0; attempt <= this.retries; attempt++) {
			const res = await this.ky(cleanPath, {
				method,
				headers: this.buildHeaders(
					method === "POST" ? "application/json" : undefined,
				),
				...(body !== undefined ? { json: body } : {}),
			});

			if (res.ok) {
				if (process.env.NODE_ENV === "test") {
					return res.json<T>();
				}
				const contentType = res.headers.get("content-type") ?? "";
				if (contentType.includes("application/json")) {
					return res.json<T>();
				}
				return undefined as T;
			}

			if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
				const retryAfter = res.headers.get("Retry-After");
				const delayMs = retryAfter
					? Number(retryAfter) * 1000
					: 2 ** attempt * 250;
				await new Promise((resolve) => setTimeout(resolve, delayMs));
				lastError = new Error(`HTTP ${res.status}`);
				continue;
			}

			const text = await res.text();
			throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
		}
		throw lastError;
	}

	public get<T>(path: string): Promise<T> {
		return this.request<T>("GET", path);
	}

	public post<T>(path: string, body?: unknown): Promise<T> {
		return this.request<T>("POST", path, body);
	}

	public async getText(path: string): Promise<string> {
		const cleanPath = path.replace(/^\//, "");
		const res = await this.ky(cleanPath, {
			method: "GET",
			headers: this.buildHeaders(),
		});
		if (!res.ok) {
			const text = await res.text();
			throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
		}
		return res.text();
	}
}
