import { User, AuthResponse, IntellaxisOptions } from './types';
import { Storage } from './storage';

export * from './types';

export class IntellaxisAuth {
  private apiKey: string;
  private baseUrl: string;
  private storage: Storage;

  constructor(apiKey: string, options: IntellaxisOptions = {}) {
    if (!apiKey) {
      throw new Error("IntellaxisAuth requires a valid API Key.");
    }
    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl || 'https://api.intellaxis.com';
    this.storage = new Storage(options.autoStoreToken !== false);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Api-Key': this.apiKey,
      ...((options.headers as Record<string, string>) || {})
    };

    // If endpoint requires auth and we have a token stored, inject it automatically
    const token = this.storage.getToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  /**
   * Register a new user
   */
  async register(email: string, password: string): Promise<User> {
    return this.request<User>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  /**
   * Login an existing user
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (response.access_token) {
      this.storage.setToken(response.access_token);
    }
    
    return response;
  }

  /**
   * Log out the current user by clearing the local token
   */
  logout(): void {
    this.storage.clearToken();
  }

  /**
   * Fetch the currently authenticated user's profile
   * Uses the stored token if available.
   */
  async getMe(token?: string): Promise<User> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return this.request<User>('/api/auth/me', {
      method: 'GET',
      headers
    });
  }

  /**
   * Send a verification email to a specific address
   */
  async sendVerificationEmail(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/auth/send-verification-email', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  /**
   * Verify an email address using the token sent via email
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  }

  /**
   * Request a password reset email
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  /**
   * Reset the password using the token sent via email
   */
  async resetPassword(token: string, new_password: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password })
    });
  }

  /**
   * Manually set the auth token
   */
  setToken(token: string): void {
    this.storage.setToken(token);
  }

  /**
   * Retrieve the current auth token
   */
  getToken(): string | null {
    return this.storage.getToken();
  }
}
