export interface User {
  id: string;
  email: string;
  is_active: boolean;
  is_email_verified: boolean;
  created_at: string;
  updated_at?: string;
  last_signed_in?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
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
