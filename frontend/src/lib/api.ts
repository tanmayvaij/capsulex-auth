const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ApiFetchOptions extends RequestInit {
  requireAuth?: boolean;
  role?: "developer" | "admin";
}

export async function apiFetch(endpoint: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { requireAuth = true, role = "developer", ...fetchOptions } = options;
  
  const headers = new Headers(fetchOptions.headers);
  const tokenKey = role === "admin" ? "admin_token" : "developer_token";
  const refreshKey = role === "admin" ? "admin_refresh_token" : "developer_refresh_token";
  const refreshEndpoint = role === "admin" ? "/api/admin/auth/refresh" : "/api/developer/auth/refresh";

  if (requireAuth) {
    const token = localStorage.getItem(tokenKey);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;

  let response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (response.status === 401 && requireAuth) {
    const refreshToken = localStorage.getItem(refreshKey);
    if (refreshToken) {
      const refreshResponse = await fetch(`${API_URL}${refreshEndpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        localStorage.setItem(tokenKey, data.access_token);
        
        // Retry original request
        headers.set("Authorization", `Bearer ${data.access_token}`);
        response = await fetch(url, {
          ...fetchOptions,
          headers,
        });
      } else {
        // Refresh failed, clear tokens
        localStorage.removeItem(tokenKey);
        localStorage.removeItem(refreshKey);
      }
    } else {
        localStorage.removeItem(tokenKey);
    }
  }

  return response;
}
