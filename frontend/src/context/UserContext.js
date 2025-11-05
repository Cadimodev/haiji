import React, { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export function useUser() {
    return useContext(UserContext);
}

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);

    useEffect(() => {
        const username = localStorage.getItem("username");
        const token = localStorage.getItem("token");
        const refreshToken = localStorage.getItem("refreshToken");

        if (username && token && refreshToken) {
            setUser({ username, token, refreshToken });
        } else {
            setUser(null);
        }
        setLoadingUser(false); // Fin de la carga de usuario
    }, []);

    const login = (username, token, refreshToken) => {
        setUser({ username, token, refreshToken });
        localStorage.setItem("username", username);
        localStorage.setItem("token", token);
        localStorage.setItem("refreshToken", refreshToken);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("username");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
    };

    return (
        <UserContext.Provider value={{ user, login, logout, loadingUser }}>
            {children}
        </UserContext.Provider>
    );
}
