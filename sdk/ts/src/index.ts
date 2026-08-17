import { User, AuthResponse, CapsulexOptions, Session } from './types';
import { Storage } from './storage';

export * from './types';

export class CapsulexAuth {
  private apiKey: string;
  private baseUrl: string;
  private storage: Storage;
  private currentUser: User | null = null;
  private listeners: Array<(user: User | null) => void> = [];

  constructor(apiKey: string, options: CapsulexOptions = {}) {
    if (!apiKey) {
      throw new Error("CapsulexAuth requires a valid API Key.");
    }
    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl || 'https://api.capsulex.com';
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
  async register(email: string, password: string, user_metadata?: Record<string, any>): Promise<User> {
    return this.request<User>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, user_metadata })
    });
  }

  /**
   * Register a listener for authentication state changes (similar to Firebase's onAuthStateChanged)
   * Returns an unsubscribe function.
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.currentUser); // Fire immediately with current state
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(user: User | null) {
    this.currentUser = user;
    this.listeners.forEach(listener => listener(user));
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
      // Automatically fetch the user to update listeners
      await this.getMe().catch(() => null);
    }
    
    return response;
  }

  /**
   * Request a 6-digit OTP code sent via email for passwordless authentication
   */
  async requestOtp(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  /**
   * Verify an OTP code and log the user in
   */
  async verifyOtp(email: string, otp_code: string, user_metadata?: Record<string, any>): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ email, otp_code, user_metadata })
    });
    
    if (response.access_token) {
      this.storage.setToken(response.access_token);
      await this.getMe().catch(() => null);
    }
    
    return response;
  }

  /**
   * Log out the current user by clearing the local token
   */
  logout(): void {
    this.storage.clearToken();
    this.notifyListeners(null);
  }

  /**
   * Update the current user's metadata
   */
  async updateMetadata(user_metadata: Record<string, any>): Promise<User> {
    const response = await this.request<User>('/api/auth/me/metadata', {
      method: 'PATCH',
      body: JSON.stringify({ user_metadata })
    });
    this.notifyListeners(response);
    return response;
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
    
    const user = await this.request<User>('/api/auth/me', {
      method: 'GET',
      headers
    });
    
    this.notifyListeners(user);
    return user;
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
   * Retrieve all active sessions for the current user
   */
  async getSessions(): Promise<Session[]> {
    return this.request<Session[]>('/api/auth/me/sessions');
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<void> {
    await this.request<{message: string}>(`/api/auth/me/sessions/${sessionId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Revoke all other active sessions except the current one
   */
  async revokeAllOtherSessions(): Promise<void> {
    await this.request<{message: string}>('/api/auth/me/sessions', {
      method: 'DELETE'
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

  /**
   * Helper to decode the current JWT token payload
   */
  private decodeToken(): any {
    const token = this.getToken();
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      let jsonPayload;
      if (typeof window !== 'undefined' && typeof window.atob === 'function') {
          jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
      } else if (typeof Buffer !== 'undefined') {
          // Node.js environment
          jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
      } else {
          // Fallback if neither is available
          return null;
      }
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  /**
   * Check if the current user has a specific role
   */
  hasRole(role: string): boolean {
    const payload = this.decodeToken();
    if (!payload || !payload.roles) return false;
    return payload.roles.includes(role);
  }

  /**
   * Check if the current user has a specific permission
   */
  hasPermission(permission: string): boolean {
    const payload = this.decodeToken();
    if (!payload || !payload.permissions) return false;
    return payload.permissions.includes(permission);
  }

  /**
   * Get all roles for the current user from the token payload
   */
  getRoles(): string[] {
    const payload = this.decodeToken();
    return payload?.roles || [];
  }

  /**
   * Get all permissions for the current user from the token payload
   */
  getPermissions(): string[] {
    const payload = this.decodeToken();
    return payload?.permissions || [];
  }
}
