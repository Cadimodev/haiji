import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from "react";

const UserContext = createContext();

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);

    // 🔹 Carga inicial del usuario (desde localStorage o backend)
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem("user");
            }
        }
        setLoadingUser(false);
    }, []);

    // 🔹 Memoriza la función login
    const login = useCallback((username, token, refreshToken) => {
        const newUser = { username, token, refreshToken };
        setUser(newUser);
        localStorage.setItem("user", JSON.stringify(newUser));
    }, []);

    // 🔹 Memoriza la función logout
    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem("user");
    }, []);

    // 🔹 Memoriza el value del contexto
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

// 🔹 Custom hook para consumir el contexto
export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}
