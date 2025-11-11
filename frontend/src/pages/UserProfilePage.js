import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useAuthForm } from "../hooks/useAuthForm";
import { useLogout } from "../hooks/useLogout";
import { useAuthManager } from "../hooks/useAuthManager";
import {
    getUserProfileAuthed,
    updateUserProfileAuthed,
} from "../services/authService";
import { validateUpdate } from "../utils/validation";
import "../styles/AuthForm.css";

function UserProfilePage() {
    const { user, login, loadingUser } = useUser();
    const handleLogout = useLogout();
    const navigate = useNavigate();

    // Hook que añade Authorization y gestiona refresh on 401 (formato uniforme)
    const { fetchJsonWithAuth } = useAuthManager();

    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Carga perfil con respuesta uniforme { ok, status, data, error }
    const loadProfile = useCallback(async () => {
        try {
            const { ok, data } = await getUserProfileAuthed(fetchJsonWithAuth);
            if (!ok || !data) {
                handleLogout();
                navigate("/");
                return;
            }
            setProfileData(data);
        } catch {
            handleLogout();
            navigate("/");
        } finally {
            setLoading(false);
        }
    }, [fetchJsonWithAuth, handleLogout, navigate]);

    // Guard: si no hay sesión cuando el contexto ya cargó, fuera
    useEffect(() => {
        if (loadingUser) return;
        if (!user?.token || !user?.refreshToken) {
            handleLogout();
            navigate("/");
            return;
        }
        loadProfile();
    }, [loadingUser, user, handleLogout, navigate, loadProfile]);

    // Valores iniciales del formulario, memorizados
    const initialValues = useMemo(
        () => ({
            email: profileData?.email || "",
            username: profileData?.username || "",
            newPassword: "",
            oldPassword: "",
        }),
        [profileData?.email, profileData?.username]
    );

    const {
        values,
        errors,
        backendError,
        handleChange,
        handleSubmit,
        setBackendError,
    } = useAuthForm(initialValues, validateUpdate);

    // Update perfil usando servicio authed (formato uniforme)
    const onSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const { ok, data, error, status } = await updateUserProfileAuthed(
                fetchJsonWithAuth,
                values
            );

            if (!ok) {
                if (status === 409) {
                    setBackendError("Email or Username already in use");

                } else {
                    setBackendError(error || "Update failed");
                }
                return;
            }

            // Si el backend devuelve tokens nuevos al actualizar, persístelos
            if (data?.token || data?.refresh_token) {
                login(
                    data.username ?? user.username,
                    data.token ?? user.token,
                    data.refresh_token ?? user.refreshToken,
                );
            }

            setBackendError("");
            await loadProfile(); // refresca datos sin recargar la página
        } catch {
            setBackendError("Error connecting to server");
        } finally {
            setIsSubmitting(false);
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
                        {errors.newPassword && <div className="error-msg">{errors.newPassword}</div>}
                        <input
                            className="auth-form-input"
                            type="password"
                            name="newPassword"
                            placeholder="New Password"
                            value={values.newPassword}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="input-group">
                        {errors.oldPassword && <div className="error-msg">{errors.oldPassword}</div>}
                        <input
                            className="auth-form-input"
                            type="password"
                            name="oldPassword"
                            placeholder="Current Password"
                            value={values.oldPassword}
                            onChange={handleChange}
                        />
                    </div>

                    <button type="submit" className="submit-button" disabled={isSubmitting}>
                        <span className="submit-button-lg">
                            <span className="submit-button-sl"></span>
                            <span className="submit-button-text">
                                {isSubmitting ? "Saving..." : "Save"}
                            </span>
                        </span>
                    </button>

                    {backendError && <div className="backend-error-msg">{backendError}</div>}
                </form>
            </div>
        </div>
    );
}

export default UserProfilePage;
