const isDevelopment = process.env.NODE_ENV === "development";

export const API_BASE_URL = isDevelopment
    ? (process.env.REACT_APP_API_URL || "http://localhost:8080")
    : "";

export const ENDPOINTS = {
    // Auth
    LOGIN: "/api/login",
    REGISTER: "/api/users", // POST
    REFRESH_TOKEN: "/api/refresh-token",
    REVOKE_TOKEN: "/api/revoke-token",

    // User
    USER_PROFILE: "/api/user-profile",
    UPDATE_USER: "/api/users", // PUT

    // Game
    KANA_BATTLE: "/api/kana-battle",
};
