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

        if (!globalRefreshPromise) {
            globalRefreshPromise = (async () => {

                const { ok, data } = await refreshTokenRequest();
                globalRefreshPromise = null;

                if (!ok || !data?.token) {
                    return null;
                }

                login(user.username, data.token);

                return data.token;
            })();
        }
        return await globalRefreshPromise;
    }, [user, login]);

    const fetchWithAuth = useCallback(
        async (input, init = {}) => {
            if (!user?.token) throw new Error("UNAUTHENTICATED");

            const doFetch = (tkn) => fetch(input, withAuth(init, tkn));

            let res = await doFetch(user.token);

            if (res.status !== 401) {
                return res;
            }

            const refreshedToken = await tryRefresh();
            if (!refreshedToken) {
                logout();
                return res;
            }

            res = await doFetch(refreshedToken);

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

            const refreshedToken = await tryRefresh();
            if (!refreshedToken) {
                logout();
                return { ...result, res: null };
            }

            result = await httpRequest(input, withAuth(init, refreshedToken));

            if (result.status === 401) {
                logout();
            }

            return { ...result, res: null };
        },
        [user, logout, tryRefresh]
    );

    return { fetchWithAuth, fetchJsonWithAuth };
}
