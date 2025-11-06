import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useAuthForm } from "../hooks/useAuthForm";
import { validateLogin } from "../utils/validation";
import { loginRequest } from "../services/authService";
import "../styles/AuthForm.css";
import "../styles/LoginPage.css";

function LoginPage() {
    const { user, loadingUser, login } = useUser();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Si ya hay sesión, saca del login (UX mejor; el guard también lo hará)
    useEffect(() => {
        if (!loadingUser && user) {
            navigate("/", { replace: true });
        }
    }, [user, loadingUser, navigate]);

    const initialValues = useMemo(() => ({ username: "", password: "" }), []);

    const {
        values,
        errors,
        backendError,
        handleChange,
        handleSubmit,
        setBackendError,
    } = useAuthForm(initialValues, validateLogin);

    const onSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        const { ok, data, error } = await loginRequest({
            username: values.username,
            password: values.password,
        });

        if (!ok) {
            setBackendError(error || "Invalid credentials");
            setIsSubmitting(false);
            return;
        }

        if (!data?.username || !data?.token) {
            setBackendError("Unexpected server response");
            setIsSubmitting(false);
            return;
        }

        login(data.username, data.token, data.refresh_token ?? "");
        navigate("/", { replace: true });
        setIsSubmitting(false);
    };

    if (loadingUser) return <div>Loading...</div>;

    return (
        <div className="auth-form-bg">
            <div className="auth-form-container">
                <h2 className="auth-form-title">Login</h2>

                <form className="auth-form" onSubmit={(e) => handleSubmit(e, onSubmit)}>
                    <div className="input-group">
                        {errors.username && <div className="error-msg">{errors.username}</div>}
                        <input
                            className="auth-form-input"
                            type="text"
                            name="username"
                            placeholder="Username"
                            value={values.username}
                            onChange={handleChange}
                            autoComplete="username"
                        />
                    </div>

                    <div className="input-group">
                        {errors.password && <div className="error-msg">{errors.password}</div>}
                        <input
                            className="auth-form-input"
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={values.password}
                            onChange={handleChange}
                            autoComplete="current-password"
                        />
                    </div>

                    <button type="submit" className="submit-button" disabled={isSubmitting}>
                        <span className="submit-button-lg">
                            <span className="submit-button-sl"></span>
                            <span className="submit-button-text">Log in</span>
                        </span>
                    </button>

                    {backendError && <div className="backend-error-msg">{backendError}</div>}
                </form>

                <NavLink to="/forgot-password" className="haiji-link">
                    Forgot password?
                </NavLink>

                <div className="register-section">
                    <span>Don't have an account?</span>
                    <NavLink to="/register" end className="haiji-link">
                        Sign up
                    </NavLink>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
