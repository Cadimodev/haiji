import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthForm } from "../hooks/useAuthForm";
import { validateRegister } from "../utils/validation";
import { registerRequest } from "../services/authService";
import "../styles/AuthForm.css";

function RegisterPage() {
    const navigate = useNavigate();

    const initialValues = useMemo(
        () => ({ email: "", username: "", password: "" }),
        []
    );

    const {
        values,
        errors,
        backendError,
        handleChange,
        handleSubmit,
        setBackendError,
    } = useAuthForm(initialValues, validateRegister);

    const onSubmit = async () => {
        try {
            const response = await registerRequest(values);

            if (!response.ok) {
                let message = "Registration failed";
                try {
                    const errorData = await response.json();
                    message = errorData.message || message;
                } catch { }
                setBackendError(message);
                return;
            }

            const data = await response.json();
            navigate("/user-creation-success", {
                replace: true,
                state: {
                    username: data.username,
                    token: data.token,
                    refresh: data.refresh_token ?? "",
                },
            });
        } catch {
            setBackendError("Error connecting to server");
        }
    };

    return (
        <div className="auth-form-bg">
            <div className="auth-form-container">
                <h2 className="auth-form-title">Register</h2>

                <form className="auth-form" onSubmit={(e) => handleSubmit(e, onSubmit)}>
                    <div className="input-group">
                        {errors.email && <div className="error-msg">{errors.email}</div>}
                        <input
                            className="auth-form-input"
                            type="text"
                            name="email"
                            placeholder="Email"
                            value={values.email}
                            onChange={handleChange}
                            autoComplete="email"
                        />
                    </div>

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
                            autoComplete="new-password"
                        />
                    </div>

                    <button type="submit" className="submit-button">
                        <span className="submit-button-lg">
                            <span className="submit-button-sl"></span>
                            <span className="submit-button-text">Register</span>
                        </span>
                    </button>

                    {backendError && <div className="backend-error-msg">{backendError}</div>}
                </form>
            </div>
        </div>
    );
}

export default RegisterPage;
