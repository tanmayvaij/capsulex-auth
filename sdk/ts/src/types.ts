export interface User {
  id: string;
  email: string;
  is_active: boolean;
  is_email_verified: boolean;
  created_at: string;
  updated_at?: string;
  last_signed_in?: string;
  user_metadata?: Record<string, any>;
  roles?: string[];
}

export interface Session {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  is_revoked: boolean;
  created_at: string;
  last_active_at: string;
  expires_at: string | null;
  is_current: boolean;
}
export interface AuthResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  user?: User;
}

export interface CapsulexOptions {
  /**
   * The base URL of your Capsulex Auth instance.
   * Defaults to 'https://api.capsulex.com' if not provided.
   */
  baseUrl?: string;
  
  /**
   * By default, the SDK handles token storage in `localStorage` in browser environments.
   * Set this to `false` if you want to handle token storage yourself (e.g. in Node.js or React Native).
   */
  autoStoreToken?: boolean;
}
