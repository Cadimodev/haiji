import { API_BASE_URL } from "../config/api";

let refreshInterceptor = null;
let accessToken = null;

export function registerAuthInterceptor(callback) {
    refreshInterceptor = callback;
}

export function setAccessToken(token) {
    accessToken = token;
}

export async function httpRequest(url, options = {}) {
    // Helper to perform the actual fetch
    const doFetch = async (reqUrl, reqOptions) => {
        try {
            const headers = {
                ...(reqOptions.headers || {}),
            };

            // Inject token automatically if present and not already set
            if (accessToken && !headers.Authorization) {
                headers.Authorization = `Bearer ${accessToken}`;
            }

            const finalOptions = {
                ...reqOptions,
                credentials: "include", // Important for cookies
                headers,
            };

            const res = await fetch(reqUrl, finalOptions);
            const contentType = res.headers.get("Content-Type") || "";

            let data = null;
            if (contentType.includes("application/json")) {
                try {
                    data = await res.json();
                } catch {
                    data = null;
                }
            }

            return { ok: res.ok, status: res.status, data, res };
        } catch (err) {
            return {
                ok: false,
                status: 0,
                data: null,
                error: err.message || "Network error",
            };
        }
    };

    // 1. Initial Request
    const fullUrl = url.startsWith("/") ? `${API_BASE_URL}${url}` : url;
    let response = await doFetch(fullUrl, options);

    // 2. Check for 401 & Interceptor
    // Avoid retrying the refresh endpoint itself to prevent infinite loops
    if (
        response.status === 401 &&
        refreshInterceptor &&
        !url.includes("/api/refresh-token") &&
        !options._retry // Custom flag to prevent infinite loops
    ) {
        try {
            // Attempt to refresh token
            const newToken = await refreshInterceptor();

            if (newToken) {
                // Retry original request with new token
                // If the original request had an Authorization header, update it
                const newOptions = {
                    ...options,
                    _retry: true,
                    headers: {
                        ...(options.headers || {}),
                        Authorization: `Bearer ${newToken}`,
                    },
                };
                response = await doFetch(fullUrl, newOptions);
            }
        } catch (error) {
            // Refresh failed, return the original 401 response or error
            console.error("Silent refresh failed:", error);
        }
    }

    // 3. Process Final Response
    if (!response.ok) {
        const message =
            response.data?.message ||
            response.data?.error ||
            `Request failed with status ${response.status}`;
        return {
            ok: false,
            status: response.status,
            data: response.data,
            error: message,
        };
    }

    return {
        ok: true,
        status: response.status,
        data: response.data,
        error: null,
    };
}
