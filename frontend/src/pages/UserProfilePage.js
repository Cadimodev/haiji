import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
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
    const handleLogout = useLogout();
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
                handleLogout();
            }
        } catch {
            handleLogout();
        }
    }, [handleLogout]);

    useEffect(() => {
        async function checkAuth() {
            if (loadingUser) return;

            if (!user?.token || !user?.refreshToken) {
                handleLogout();
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
                        handleLogout();
                    }
                } else {
                    handleLogout();
                }
            }
            setLoading(false);
        }
        checkAuth();
    }, [user, login, handleLogout, loadingUser, loadProfile]);

    useEffect(() => {
        if (user === null && !loadingUser) {
            navigate("/");
        }
    }, [user, loadingUser, navigate]);

    console.log("profileData", profileData);

    // Sólo se crea initialValues al cambiar profileData
    const initialValues = useMemo(() => {
        return {
            email: profileData?.email || "",
            username: profileData?.username || "",
            password: "",
        };
    }, [profileData]);

    const {
        values,
        errors,
        backendError,
        handleChange,
        handleSubmit,
        setBackendError,
    } = useAuthForm(initialValues, validateRegister);

    console.log("form values", values);

    const onSubmit = async () => {
        try {
            const response = await fetch("/api/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: "Bearer " + user.token },
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
            navigate(0);
        } catch (error) {
            setBackendError("Error connecting to server");
        }
    };

    if (loadingUser || loading) return <div>Loading...</div>;
    if (!profileData) return <div>Profile could not be loaded..</div>;

    return (
        <div className="auth-form-bg">
            <div className="auth-form-container">
                <h2 className="auth-form-title">Update User Data</h2>
                <form className="auth-form" onSubmit={(e) => handleSubmit(e, onSubmit)}>
                    <div className="input-group">
                        {errors.email && <div className="error-msg">{errors.email}</div>}
                        <input
                            className='auth-form-input'
                            type="text"
                            name="email"
                            value={values.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="input-group">
                        {errors.username && <div className="error-msg">{errors.username}</div>}
                        <input
                            className='auth-form-input'
                            type="text"
                            name="username"
                            value={values.username}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="input-group">
                        {errors.password && <div className="error-msg">{errors.password}</div>}
                        <input
                            className='auth-form-input'
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
