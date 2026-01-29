const isDevelopment = process.env.NODE_ENV === "development";

export const API_BASE_URL = isDevelopment
    ? (process.env.REACT_APP_API_URL || "http://localhost:8080")
    : "";

export const ENDPOINTS = {
    KANA_BATTLE: "/api/kana-battle",
};
