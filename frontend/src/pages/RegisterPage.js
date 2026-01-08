import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthForm } from "../hooks/useAuthForm";
import { validateRegister } from "../utils/validation";
import { registerRequest } from "../services/authService";
import "../styles/AuthForm.css";

function RegisterPage() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        if (isSubmitting) return;
        setIsSubmitting(true);

        const { ok, data, error, status } = await registerRequest(values);

        if (!ok) {
            if (status === 409) {
                setBackendError("Email or Username already in use");
            } else {
                setBackendError(error || "Registration failed");
            }

            setIsSubmitting(false);
            return;
        }

        if (!data?.username || !data?.token) {
            setBackendError("Unexpected server response");
            setIsSubmitting(false);
            return;
        }

        navigate("/user-creation-success", {
            replace: true,
            state: {
                username: data.username,
                token: data.token,
            },
        });

        setIsSubmitting(false);
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

                    <button type="submit" className="submit-button" disabled={isSubmitting}>
                        <span className="submit-button-lg">
                            <span className="submit-button-sl"></span>
                            <span className="submit-button-text">
                                {isSubmitting ? "Registering..." : "Register"}
                            </span>
                        </span>
                    </button>

                    {backendError && <div className="backend-error-msg">{backendError}</div>}
                </form>
            </div>
        </div>
    );
}

export default RegisterPage;
