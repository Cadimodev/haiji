import React, { useEffect, useMemo } from "react";
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

    // Si hay sesión, sácale del login (tu guard también lo hará, pero esto da mejor UX)
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
        try {
            const resp = await loginRequest({
                username: values.username,
                password: values.password,
            });

            if (!resp.ok) {
                let message = "Invalid credentials";
                try {
                    const e = await resp.json();
                    message = e.message || message;
                } catch { }
                setBackendError(message);
                return;
            }

            const data = await resp.json(); // { username, token, refresh_token, ... }
            login(data.username, data.token, data.refresh_token ?? "");
            navigate("/", { replace: true });
        } catch {
            setBackendError("Cannot reach server");
        }
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

                    <button type="submit" className="submit-button">
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
                <div className='register-section'>
                    <span>Don't have an account?</span>
                    <NavLink to="/register" end className="haiji-link" >Sign up</NavLink>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
