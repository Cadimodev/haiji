import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

// Only accessible if there is an authenticated user
export function ProtectedRoute({ children }) {
    const { user, loadingUser } = useUser();
    if (loadingUser) return null; // o un spinner

    return user ? children : <Navigate to="/login" replace />;
}

// Only accessible if there is NO authenticated user
export function PublicOnlyRoute({ children }) {
    const { user, loadingUser } = useUser();
    if (loadingUser) return null;

    return !user ? children : <Navigate to="/" replace />;
}
