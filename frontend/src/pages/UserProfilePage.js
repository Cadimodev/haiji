import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from 'react-router-dom'
import { useUser } from "../context/UserContext";
import { validateToken, refreshTokenRequest } from "../utils/authService";

function UserProfilePage() {
    const { user, login, logout, loadingUser } = useUser();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loadProfile = useCallback(async (token) => {
        try {
            const response = await fetch("/api/user-profile", {
                method: "GET",
                headers: { Authorization: "Bearer " + token },
            });
            if (response.ok) {
                const data = await response.json();
                setProfileData(data);
            } else {
                logout();
            }
        } catch {
            logout();
        }
    }, [logout]);

    useEffect(() => {
        async function checkAuth() {
            if (loadingUser) return;  // wait user loading

            if (!user?.token || !user?.refreshToken) {
                logout();
                return;
            }

            let valid = await validateToken(user.token);
            if (valid) {
                await loadProfile(user.token);
            } else {
                const newJWT = await refreshTokenRequest(user.refreshToken);
                if (newJWT) {
                    login(user.username, newJWT, user.refreshToken);
                    const validNuevo = await validateToken(newJWT);
                    if (validNuevo) {
                        await loadProfile(newJWT);
                    } else {
                        logout();
                    }
                } else {
                    logout();
                }
            }
            setLoading(false);
        }
        checkAuth();
    }, [user, login, logout, loadingUser, loadProfile]);

    useEffect(() => {
        if (user === null && !loadingUser) {
            navigate("/");
        }
    }, [user, loadingUser, navigate])

    if (loadingUser || loading) return <div></div>;
    if (!profileData) return <div>Profile could not be loaded..</div>;

    return (
        <div>
            <p>Email: {profileData.email}</p>
            <p>Username: {profileData.username}</p>
        </div>
    );
}

export default UserProfilePage;
