export class Storage {
  private static readonly TOKEN_KEY = 'intellaxis_auth_token';
  private memToken: string | null = null;

  constructor(private autoStoreToken: boolean = true) {}

  setToken(token: string): void {
    if (this.autoStoreToken) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(Storage.TOKEN_KEY, token);
      } else {
        this.memToken = token;
      }
    } else {
      this.memToken = token;
    }
  }

  getToken(): string | null {
    if (this.autoStoreToken && typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(Storage.TOKEN_KEY) || this.memToken;
    }
    return this.memToken;
  }

  clearToken(): void {
    this.memToken = null;
    if (this.autoStoreToken && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(Storage.TOKEN_KEY);
    }
  }
}
