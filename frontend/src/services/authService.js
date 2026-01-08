import { httpRequest } from "../utils/http"; // para login/register/refresh

export function loginRequest({ username, password }) {
    return httpRequest("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
}

export function registerRequest({ email, username, password }) {
    return httpRequest("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
    });
}

export function refreshTokenRequest() {
    return httpRequest("/api/refresh-token", {
        method: "POST",
    });
}

export function getUserProfileAuthed(fetcher) {
    return fetcher("/api/user-profile", { method: "GET" });
}

export function updateUserProfileAuthed(fetcher, payload) {
    return fetcher("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}

export function revokeTokenRequest() {
    return httpRequest("/api/revoke-token", {
        method: "POST",
    });
}

