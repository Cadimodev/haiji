import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { validateToken, refreshTokenRequest } from "../utils/authService";
import { useAuthForm } from "../hooks/useAuthForm";
import { useLogout } from "../hooks/useLogout";
import { validateRegister } from "../utils/validation";
import "../styles/AuthForm.css";

function UserProfilePage() {
    const { user, login, loadingUser } = useUser();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();
    const handleLogout = useLogout();

    // 🔹 Carga el perfil de usuario desde el backend
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
                handleLogout();
                navigate("/");
            }
        } catch {
            handleLogout();
            navigate("/");
        }
    }, [handleLogout, navigate]);

    // 🔹 Verifica autenticación y carga datos del perfil
    useEffect(() => {
        async function checkAuth() {
            if (loadingUser) return;

            if (!user?.token || !user?.refreshToken) {
                handleLogout();
                navigate("/");
                return;
            }

            const valid = await validateToken(user.token);
            if (valid) {
                await loadProfile(user.token);
            } else {
                const newJWT = await refreshTokenRequest(user.refreshToken);
                if (newJWT) {
                    login(user.username, newJWT, user.refreshToken);
                    const stillValid = await validateToken(newJWT);
                    if (stillValid) {
                        await loadProfile(newJWT);
                    } else {
                        handleLogout();
                        navigate("/");
                    }
                } else {
                    handleLogout();
                    navigate("/");
                }
            }

            setLoading(false);
        }

        checkAuth();
    }, [user, loadingUser, login, handleLogout, navigate, loadProfile]);

    // 🔹 Redirige si el usuario ha hecho logout mientras tanto
    useEffect(() => {
        if (!user && !loadingUser) {
            navigate("/");
        }
    }, [user, loadingUser, navigate]);

    // 🔹 Valores iniciales del formulario, memorizados
    const initialValues = useMemo(() => ({
        email: profileData?.email || "",
        username: profileData?.username || "",
        password: "",
    }), [profileData?.email, profileData?.username]);

    // 🔹 Hook del formulario de autenticación
    const {
        values,
        errors,
        backendError,
        handleChange,
        handleSubmit,
        setBackendError,
    } = useAuthForm(initialValues, validateRegister);

    // 🔹 Envía los cambios al backend
    const onSubmit = async () => {
        try {
            const response = await fetch("/api/users", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + user.token,
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setBackendError(errorData.message || "Update failed");
                return;
            }

            const data = await response.json();
            login(data.username, data.token || user.token, user.refreshToken);
            setBackendError("");
            navigate(0); // refresca página
        } catch {
            setBackendError("Error connecting to server");
        }
    };

    if (loadingUser || loading) return <div>Loading...</div>;
    if (!profileData) return <div>Profile could not be loaded.</div>;

    return (
        <div className="auth-form-bg">
            <div className="auth-form-container">
                <h2 className="auth-form-title">Update User Data</h2>

                <form className="auth-form" onSubmit={(e) => handleSubmit(e, onSubmit)}>
                    <div className="input-group">
                        {errors.email && <div className="error-msg">{errors.email}</div>}
                        <input
                            className="auth-form-input"
                            type="text"
                            name="email"
                            value={values.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="input-group">
                        {errors.username && <div className="error-msg">{errors.username}</div>}
                        <input
                            className="auth-form-input"
                            type="text"
                            name="username"
                            value={values.username}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="input-group">
                        {errors.password && <div className="error-msg">{errors.password}</div>}
                        <input
                            className="auth-form-input"
                            type="password"
                            name="password"
                            placeholder="New Password"
                            value={values.password}
                            onChange={handleChange}
                        />
                    </div>

                    <button type="submit" className="submit-button">
                        <span className="submit-button-lg">
                            <span className="submit-button-sl"></span>
                            <span className="submit-button-text">Save</span>
                        </span>
                    </button>

                    {backendError && <div className="backend-error-msg">{backendError}</div>}
                </form>
            </div>
        </div>
    );
}

export default UserProfilePage;
