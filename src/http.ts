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
		const url = `${this.baseUrl}/${cleanPath}`;
		let lastError: unknown;
		for (let attempt = 0; attempt <= this.retries; attempt++) {
			const controller = new AbortController();
			const timer = setTimeout(() => controller.abort(), this.timeout);
			try {
				const res = await fetch(url, {
					method,
					headers: this.buildHeaders(
						method === "POST" ? "application/json" : undefined,
					),
					...(body !== undefined ? { body: JSON.stringify(body) } : {}),
					signal: controller.signal,
				});
				clearTimeout(timer);

				if (res.ok) {
					if (process.env.NODE_ENV === "test") {
						return res.json() as Promise<T>;
					}
					const contentType = res.headers.get("content-type") ?? "";
					if (contentType.includes("application/json")) {
						return res.json() as Promise<T>;
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
			} catch (error) {
				clearTimeout(timer);
				lastError = error;
				if (attempt < this.retries) {
					await new Promise((resolve) =>
						setTimeout(resolve, 2 ** attempt * 250),
					);
					continue;
				}
				throw error;
			}
		}
		throw lastError;
	}

	public get<T>(path: string): Promise<T> {
		return this.request<T>("GET", path);
	}

	public post<T>(path: string, body?: unknown): Promise<T> {
		return this.request<T>("POST", path, body);
	}
}
