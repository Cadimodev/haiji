import React from "react";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { useAuthForm } from "../hooks/useAuthForm";
import { validateRegister } from "../utils/validation";
import "../styles/AuthForm.css";

function RegisterPage() {
    const { login } = useUser();
    const navigate = useNavigate();

    const {
        values,
        errors,
        backendError,
        handleChange,
        handleSubmit,
        setBackendError,
    } = useAuthForm(
        { email: "", username: "", password: "" },
        validateRegister
    );

    const onSubmit = async () => {
        try {
            const response = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setBackendError(errorData.message || "Registration failed");
                return;
            }

            const data = await response.json();
            login(data.username, data.token);
            navigate("/user-creation-success");
        } catch (error) {
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
                            className='auth-form-input'
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
                            className='auth-form-input'
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
                            className='auth-form-input'
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
