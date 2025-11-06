// src/hooks/useAuthManager.js
import { useCallback } from "react";
import { useUser } from "../context/UserContext";
import { refreshTokenRequest } from "../services/authService";
import { httpRequest } from "../utils/http"; // para la variante JSON uniforme

// Helper para añadir el header Authorization
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

    /**
     * Intenta refrescar el access token.
     * Devuelve el nuevo token (string) o null si falla.
     */
    const tryRefresh = useCallback(async () => {
        if (!user?.refreshToken) return null;

        const { ok, data } = await refreshTokenRequest(user.refreshToken);
        if (!ok || !data?.token) return null;

        const newToken = data.token;
        const newRefresh = data.refresh_token ?? user.refreshToken;

        // Persistimos (esto estabiliza el contexto con el nuevo token)
        login(user.username, newToken, newRefresh);
        return newToken;
    }, [user, login]);

    /**
     * fetch con auth que reintenta una vez si recibe 401.
     * Devuelve Response nativo.
     */
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

    /**
     * Variante cómoda que devuelve un objeto uniforme:
     * { ok, status, data, error, res }
     *
     * - Usa httpRequest para parsear JSON y construir 'error' coherente.
     * - Reintenta una vez tras refresh si recibe 401 en el primer intento.
     */
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
