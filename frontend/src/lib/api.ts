const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ApiFetchOptions extends RequestInit {
  requireAuth?: boolean;
  role?: "developer" | "admin";
}

export async function apiFetch(endpoint: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { requireAuth = true, role = "developer", ...fetchOptions } = options;
  
  const headers = new Headers(fetchOptions.headers);
  
  // Tokens are now stored in httpOnly cookies, so we don't need to manually append them.
  // We just ensure credentials (cookies) are sent with every request.
  const fetchOptionsWithCreds: RequestInit = {
    ...fetchOptions,
    credentials: "include", // Send cookies with requests
    headers,
  };

  const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;

  let response = await fetch(url, fetchOptionsWithCreds);

  if (response.status === 401 && requireAuth) {
    // With httpOnly cookies, we just call the refresh endpoint.
    // The backend will automatically read the refresh cookie and set a new access cookie.
    const refreshEndpoint = role === "admin" ? "/api/admin/auth/refresh" : "/api/developer/auth/refresh";
    
    const refreshResponse = await fetch(`${API_URL}${refreshEndpoint}`, {
      method: "POST",
      credentials: "include", // Important: send the refresh cookie
      headers: {
        "Content-Type": "application/json",
      },
      // Note: No body needed, backend reads from cookie
    });

    if (refreshResponse.ok) {
      // Retry original request
      response = await fetch(url, fetchOptionsWithCreds);
    } else {
      // Refresh failed. The backend likely cleared the cookies, or we should redirect to login.
      if (typeof window !== 'undefined') {
        window.location.href = "/login";
      }
    }
  }

  return response;
}
