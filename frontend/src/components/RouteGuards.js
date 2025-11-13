import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

function FullscreenLoader() {
    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <p>Loading...</p>
        </div>
    );
}

// Only accessible if there is an authenticated user
export function ProtectedRoute({ children }) {
    const { user, loadingUser } = useUser();
    if (loadingUser) {
        return <FullscreenLoader />;
    }

    return user ? children : <Navigate to="/login" replace />;
}

// Only accessible if there is NO authenticated user
export function PublicOnlyRoute({ children }) {
    const { user, loadingUser } = useUser();
    if (loadingUser) {
        return <FullscreenLoader />;
    }

    return !user ? children : <Navigate to="/" replace />;
}
