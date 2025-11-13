import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from "react";
import { refreshTokenRequest } from "../services/authService";

const UserContext = createContext();

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");

        if (!storedUser) {
            setLoadingUser(false);
            return;
        }

        let parsed;
        try {
            parsed = JSON.parse(storedUser);
        } catch {
            localStorage.removeItem("user");
            setLoadingUser(false);
            return;
        }

        // try to make a silent refresh while mounting
        (async () => {
            const { ok, data } = await refreshTokenRequest(parsed.refreshToken);

            if (!ok || !data?.token) {
                localStorage.removeItem("user");
                setUser(null);
                setLoadingUser(false);
                return;
            }

            const updated = {
                username: parsed.username,
                token: data.token,
                refreshToken: data.refresh_token ?? parsed.refreshToken,
            };

            setUser(updated);
            localStorage.setItem("user", JSON.stringify(updated));
            setLoadingUser(false);
        })();
    }, []);

    const login = useCallback((username, token, refreshToken) => {
        const newUser = { username, token, refreshToken };
        setUser(newUser);
        localStorage.setItem("user", JSON.stringify(newUser));
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem("user");
    }, []);

    const value = useMemo(
        () => ({
            user,
            login,
            logout,
            loadingUser,
        }),
        [user, login, logout, loadingUser]
    );

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}
