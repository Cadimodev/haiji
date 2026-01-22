import { useCallback } from "react";
import { useUser } from "../context/UserContext";
import { httpRequest } from "../utils/http";

export function useApi() {
    const { user } = useUser();

    // Helper to attach token automatically
    const authenticatedRequest = useCallback(
        (url, options = {}) => {
            if (!user?.token) {
                return Promise.resolve({
                    ok: false,
                    status: 401,
                    data: null,
                    error: "No active session"
                });
            }

            const headers = {
                ...(options.headers || {}),
                Authorization: `Bearer ${user.token}`,
            };

            return httpRequest(url, { ...options, headers });
        },
        [user]
    );

    // --- Services ---

    const getUserProfile = useCallback(() => {
        return authenticatedRequest("/api/user-profile", { method: "GET" });
    }, [authenticatedRequest]);

    const updateUserProfile = useCallback((payload) => {
        return authenticatedRequest("/api/users", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    }, [authenticatedRequest]);

    const createBattleRoom = useCallback((duration, groups) => {
        return authenticatedRequest("/api/kana-battle", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ duration, groups }),
        });
    }, [authenticatedRequest]);

    return {
        getUserProfile,
        updateUserProfile,
        createBattleRoom,
    };
}
