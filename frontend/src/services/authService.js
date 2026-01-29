import { httpRequest } from "../utils/http";
import { ENDPOINTS } from "../config/api";

export function loginRequest({ username, password }) {
    return httpRequest(ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
}

export function registerRequest({ email, username, password }) {
    return httpRequest(ENDPOINTS.REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
    });
}

export function refreshTokenRequest() {
    return httpRequest(ENDPOINTS.REFRESH_TOKEN, {
        method: "POST",
    });
}

export function revokeTokenRequest() {
    return httpRequest(ENDPOINTS.REVOKE_TOKEN, {
        method: "POST",
    });
}

