import { useCallback } from "react";
import { useUser } from "../context/UserContext";
import { refreshTokenRequest } from "../services/authService";
import { httpRequest } from "../utils/http";

let globalRefreshPromise = null;

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
    const { user, login, logout } = useUser();

    const tryRefresh = useCallback(async () => {
        if (!user?.refreshToken) {
            return null;
        }

        if (!globalRefreshPromise) {
            globalRefreshPromise = (async () => {

                const { ok, data } = await refreshTokenRequest(user.refreshToken);
                globalRefreshPromise = null;

                if (!ok || !data?.token) {
                    return null;
                }

                const newToken = data.token;
                const newRefresh = data.refresh_token ?? user.refreshToken;
                login(user.username, newToken, newRefresh);

                return newToken;
            })();
        }
        return await globalRefreshPromise;
    }, [user, login]);

    const fetchWithAuth = useCallback(
        async (input, init = {}) => {
            if (!user?.token) throw new Error("UNAUTHENTICATED");

            const doFetch = (tkn) => fetch(input, withAuth(init, tkn));

            let res = await doFetch(user.token);

            if (res.status !== 401) return res;

            if (!user.refreshToken) {
                logout();
                return res;
            }

            const refreshed = await tryRefresh();
            if (!refreshed) {
                logout();
                return res;
            }

            res = await doFetch(refreshed);

            if (res.status === 401) {
                logout();
            }
            return res;
        },
        [user, tryRefresh, logout]
    );

    const fetchJsonWithAuth = useCallback(
        async (input, init = {}) => {
            if (!user?.token) {
                return { ok: false, status: 0, data: null, error: "UNAUTHENTICATED", res: null };
            }

            let result = await httpRequest(input, withAuth(init, user.token));

            if (result.status !== 401) {
                return { ...result, res: null };
            }

            if (!user.refreshToken) {
                logout();
                return { ...result, res: null };
            }

            const refreshed = await tryRefresh();
            if (!refreshed) {
                logout();
                return { ...result, res: null };
            }

            result = await httpRequest(input, withAuth(init, refreshed));

            if (result.status === 401) {
                logout();
            }

            return { ...result, res: null };
        },
        [user, logout, tryRefresh]
    );

    return { fetchWithAuth, fetchJsonWithAuth };
}
