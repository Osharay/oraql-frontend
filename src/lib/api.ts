'use client';

/**
 * OraQL_ API client.
 * Handles auth tokens, request/response interceptors, and error handling.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const API_PREFIX = '/api/v1';

const TOKEN_KEY = 'oracle_token';
const REFRESH_KEY = 'oracle_refresh';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

class ApiClient {
  private accessToken: string | null = null;

  /**
   * One shared refresh at a time. Several requests usually fail together when
   * the access token expires, and letting each start its own refresh would
   * rotate the stored token repeatedly — every rotation invalidating the one
   * the other requests are holding.
   */
  private refreshing: Promise<string | null> | null = null;

  setToken(token: string | null) {
    this.accessToken = token;
    if (typeof window === 'undefined') return;
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Storage can be unavailable (private mode, blocked cookies); the token
      // still works for this page's lifetime.
    }
  }

  getToken(): string | null {
    if (this.accessToken) return this.accessToken;
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  setRefreshToken(token: string | null) {
    if (typeof window === 'undefined') return;
    try {
      if (token) localStorage.setItem(REFRESH_KEY, token);
      else localStorage.removeItem(REFRESH_KEY);
    } catch {
      // as above
    }
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(REFRESH_KEY);
    } catch {
      return null;
    }
  }

  setTokens(tokens: TokenPair) {
    this.setToken(tokens.accessToken);
    this.setRefreshToken(tokens.refreshToken);
  }

  clearTokens() {
    this.setToken(null);
    this.setRefreshToken(null);
  }

  /**
   * Trade the refresh token for a new pair. Resolves to the new access token,
   * or null when the refresh token is gone or no longer accepted — which is
   * the only case that should send someone back to the login screen.
   */
  private async refreshAccessToken(): Promise<string | null> {
    if (this.refreshing) return this.refreshing;

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    this.refreshing = (async () => {
      try {
        const response = await fetch(`${API_BASE}${API_PREFIX}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) return null;

        const tokens = (await response.json()) as TokenPair;
        if (!tokens?.accessToken) return null;

        this.setTokens(tokens);
        return tokens.accessToken;
      } catch {
        return null;
      } finally {
        this.refreshing = null;
      }
    })();

    return this.refreshing;
  }

  private async send(
    method: string,
    path: string,
    body: unknown,
    options: RequestInit,
    token: string | null,
  ): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers as Record<string, string>),
    };

    return fetch(`${API_BASE}${API_PREFIX}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options: RequestInit = {},
  ): Promise<T> {
    let response = await this.send(method, path, body, options, this.getToken());

    // The access token lasts 15 minutes. A 401 usually means it has simply
    // expired, not that the session is over — the refresh token is good for
    // 30 days. Renew once and retry before giving up on the session.
    const isAuthCall = path.startsWith('/auth/');
    if (response.status === 401 && !isAuthCall) {
      const renewed = await this.refreshAccessToken();
      if (renewed) {
        response = await this.send(method, path, body, options, renewed);
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));

      // Only now is the session genuinely over.
      if (response.status === 401 && !isAuthCall) {
        this.clearTokens();
        if (typeof window !== 'undefined' && window.location.pathname !== '/auth') {
          window.location.href = '/auth';
        }
      }

      throw new ApiError(response.status, error.message || 'Request failed', error.errors);
    }

    return response.json();
  }

  // ─── HTTP Methods ───

  get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: string[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Singleton instance
export const api = new ApiClient();
