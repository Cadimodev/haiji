import { useCallback } from "react";
import { useUser } from "../context/UserContext";
import { httpRequest } from "../utils/http";

function withAuth(init = {}, token) {
    return {
        ...init,
        headers: {
            ...(init.headers || {}),
            Authorization: "Bearer " + token,
        },
    };
}

export function useAuthManager() {
    const { user } = useUser();

    // Standard fetch wrapper
    const fetchWithAuth = useCallback(
        async (input, init = {}) => {
            if (!user?.token) throw new Error("UNAUTHENTICATED");
            return fetch(input, withAuth(init, user.token));
        },
        [user]
    );

    // JSON fetch wrapper using shared httpRequest which handles 401s auto-magically
    const fetchJsonWithAuth = useCallback(
        async (input, init = {}) => {
            if (!user?.token) {
                return { ok: false, status: 0, data: null, error: "UNAUTHENTICATED", res: null };
            }
            // httpRequest handles the interceptors/refresh logic internally
            return httpRequest(input, withAuth(init, user.token));
        },
        [user]
    );

    return { fetchWithAuth, fetchJsonWithAuth };
}
