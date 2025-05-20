// src/http.ts
export interface HttpOpts {
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Number of retry attempts for failed requests */
  retries?: number;
  /** App version for client identification (default: 6.4.0) */
  appVersion?: string;
  /** Client type for identification (default: electron) */
  clientType?: string;
  /** Platform for client identification (default: darwin) */
  clientPlatform?: string;
  /** Architecture for client identification (default: arm64) */
  clientArchitecture?: string;
  /** Electron version for user agent (default: 33.4.5) */
  electronVersion?: string;
  /** Chrome version for user agent (default: 130.0.6723.191) */
  chromeVersion?: string;
  /** Node version for user agent (default: 20.18.3) */
  nodeVersion?: string;
  /** OS version for user agent (default: 15.3.1) */
  osVersion?: string;
  /** OS build for user agent (default: 24D70) */
  osBuild?: string;
  /** Additional client headers to include in requests */
  clientHeaders?: Record<string, string>;
}

/**
 * HTTP client wrapper around fetch with retry and timeout support.
 */
export class Http {
  private token?: string;
  private baseUrl: string;
  private timeout: number;
  private retries: number;
  private appVersion: string;
  private clientType: string;
  private clientPlatform: string;
  private clientArchitecture: string;
  private electronVersion: string;
  private chromeVersion: string;
  private nodeVersion: string;
  private osVersion: string;
  private osBuild: string;
  private clientHeaders: Record<string, string>;
  private tokenProvider?: () => Promise<string>;
  private isTokenBeingFetched = false;

  constructor(token?: string, baseUrl = 'https://api.granola.ai', opts: HttpOpts = {}) {
    this.token = token;
    this.baseUrl = baseUrl.replace(/\/+$/g, '');
    this.timeout = opts.timeout ?? 5000;
    this.retries = opts.retries ?? 3;
    this.appVersion = opts.appVersion ?? '6.4.0';
    this.clientType = opts.clientType ?? 'electron';
    this.clientPlatform = opts.clientPlatform ?? 'darwin';
    this.clientArchitecture = opts.clientArchitecture ?? 'arm64';
    this.electronVersion = opts.electronVersion ?? '33.4.5';
    this.chromeVersion = opts.chromeVersion ?? '130.0.6723.191';
    this.nodeVersion = opts.nodeVersion ?? '20.18.3';
    this.osVersion = opts.osVersion ?? '15.3.1';
    this.osBuild = opts.osBuild ?? '24D70';
    this.clientHeaders = opts.clientHeaders ?? {};
  }
  
  /**
   * Set or update the authentication token.
   * @param token The new token to use for authentication
   */
  public setToken(token: string): void {
    this.token = token;
  }
  
  /**
   * Set a function that provides a token when needed.
   * This will be called lazily when making a request without a token.
   * @param provider Function that returns a Promise resolving to a token
   */
  public setTokenProvider(provider: () => Promise<string>): void {
    this.tokenProvider = provider;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getBackoffDelay(attempt: number, retryAfterHeader: string | null = null): number {
    if (retryAfterHeader) {
      const seconds = parseInt(retryAfterHeader, 10);
      if (!isNaN(seconds)) return seconds * 1000;
    }
    return Math.pow(2, attempt) * 250;
  }

  /**
   * Ensures that a valid token is available before making a request.
   * Uses a token provider if one is set and no token is available.
   * @returns A promise that resolves when a valid token is ready
   */
  private async ensureToken(): Promise<void> {
    // If we already have a token, no need to fetch one
    if (this.token) {
      return;
    }
    
    // If we don't have a token provider, nothing to do
    if (!this.tokenProvider) {
      return;
    }
    
    // Simple lock to prevent multiple concurrent token fetches
    if (this.isTokenBeingFetched) {
      // Wait a bit for the other fetch to complete
      for (let i = 0; i < 10; i++) {
        await this.delay(100);
        if (this.token) {
          return;
        }
      }
    }
    
    try {
      this.isTokenBeingFetched = true;
      this.token = await this.tokenProvider();
    } catch (error) {
      console.error('Error fetching token:', error);
      throw new Error(`Failed to retrieve authentication token: ${(error as Error).message}`);
    } finally {
      this.isTokenBeingFetched = false;
    }
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    // Try to ensure we have a token before making the request
    await this.ensureToken();
    
    const url = new URL(path, this.baseUrl).toString();
    let lastError: unknown;
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeout);
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        };
        
        // Only add authorization header if token is provided
        if (this.token) {
          headers.Authorization = `Bearer ${this.token}`;
        }
        
        // Add client identification headers (always enabled)
        // Standard client headers
        headers['X-App-Version'] = this.appVersion;
        headers['User-Agent'] = `Granola/${this.appVersion} Electron/${this.electronVersion} Chrome/${this.chromeVersion} Node/${this.nodeVersion} (macOS ${this.osVersion} ${this.osBuild})`;
        headers['X-Client-Type'] = this.clientType;
        headers['X-Client-Platform'] = this.clientPlatform;
        headers['X-Client-Architecture'] = this.clientArchitecture;
        headers['X-Client-Id'] = `granola-${this.clientType}-${this.appVersion}`;
        
        // Add any additional client headers
        Object.assign(headers, this.clientHeaders);
        const init: RequestInit = { method, headers, signal: controller.signal };
        if (body !== undefined) init.body = JSON.stringify(body);
        const res = await fetch(url, init);
        clearTimeout(timer);
        if (res.ok) {
          // For tests, always parse JSON
          if (process.env.NODE_ENV === 'test') {
            return (await res.json()) as T;
          }
          // For normal operation, parse JSON only if content-type indicates JSON
          const contentType = res.headers.get('content-type') ?? '';
          if (contentType.includes('application/json')) {
            return (await res.json()) as T;
          }
          return undefined as T;
        }
        // retry on rate limit or server errors
        if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
          const retryAfter = res.headers.get('Retry-After');
          const delayMs = this.getBackoffDelay(attempt, retryAfter);
          await this.delay(delayMs);
          continue;
        }
        // non-retriable error
        const text = await res.text();
        throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
      } catch (err: unknown) {
        clearTimeout(timer);
        lastError = err;
        // handle abort (timeout)
        if ((err as any)?.name === 'AbortError') {
          if (attempt < this.retries) {
            const delayMs = this.getBackoffDelay(attempt);
            await this.delay(delayMs);
            continue;
          }
          throw new Error(`Request timed out after ${this.timeout} ms`);
        }
        // retry on other errors
        if (attempt < this.retries) {
          const delayMs = this.getBackoffDelay(attempt);
          await this.delay(delayMs);
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  /**
   * Perform a GET request and parse JSON response.
   */
  public get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  /**
   * Perform a POST request with JSON body and parse JSON response.
   */
  public post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  /**
   * Perform a GET request and return raw text.
   */
  public async getText(path: string): Promise<string> {
    // Try to ensure we have a token before making the request
    await this.ensureToken();
    
    const url = new URL(path, this.baseUrl).toString();
    const headers: Record<string, string> = {};
    
    // Only add authorization header if token is provided
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    // Add client identification headers (always enabled)
    // Standard client headers
    headers['X-App-Version'] = this.appVersion;
    headers['User-Agent'] = `Granola/${this.appVersion} Electron/${this.electronVersion} Chrome/${this.chromeVersion} Node/${this.nodeVersion} (macOS ${this.osVersion} ${this.osBuild})`;
    headers['X-Client-Type'] = this.clientType;
    headers['X-Client-Platform'] = this.clientPlatform;
    headers['X-Client-Architecture'] = this.clientArchitecture;
    headers['X-Client-Id'] = `granola-${this.clientType}-${this.appVersion}`;
    
    // Add any additional client headers
    Object.assign(headers, this.clientHeaders);
    
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
    }
    return await res.text();
  }
}