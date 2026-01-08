import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from "react";
import { refreshTokenRequest, revokeTokenRequest } from "../services/authService";

const UserContext = createContext();

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);

    useEffect(() => {
        const initializeUser = async () => {
            const storedUser = localStorage.getItem("user");
            let parsedUser = null;

            if (storedUser) {
                try {
                    parsedUser = JSON.parse(storedUser);
                } catch {
                    localStorage.removeItem("user");
                }
            }

            const { ok, data } = await refreshTokenRequest();

            if (ok && data?.token) {
                const username = data.user?.username || parsedUser?.username || "User";
                const updatedUser = {
                    username: username,
                    token: data.token,
                };
                setUser(updatedUser);

                localStorage.setItem("user", JSON.stringify({ username: updatedUser.username }));
            } else {
                localStorage.removeItem("user");
                setUser(null);
            }
            setLoadingUser(false);
        };

        initializeUser();
    }, []);

    const login = useCallback((username, token) => {
        const newUser = { username, token };
        setUser(newUser);
        localStorage.setItem("user", JSON.stringify({ username }));
    }, []);

    const logout = useCallback(async () => {
        try {
            await revokeTokenRequest();
        } catch (error) {
            console.error("Error logging out of server:", error);
        } finally {
            setUser(null);
            localStorage.removeItem("user");
        }
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
