import { NavLink, useNavigate } from 'react-router-dom'
import React, { useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useAuthForm } from "../hooks/useAuthForm";
import { validateLogin } from "../utils/validation";
import "../styles/AuthForm.css";
import "../styles/LoginPage.css";

function LoginPage() {
    const { login, user } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate("/");
        }
    }, [user, navigate]);

    const {
        values,
        errors,
        backendError,
        handleChange,
        handleSubmit,
        setBackendError,
    } = useAuthForm(
        { username: "", password: "" },
        validateLogin
    );

    const onSubmit = async () => {
        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setBackendError(errorData.message || "Login failed");
                return;
            }

            const data = await response.json();
            login(data.username, data.token); // Actualiza el contexto global
            navigate("/"); // Redirigir
        } catch (error) {
            setBackendError("Error connecting to server");
        }
    };


    return (
        <div className="auth-form-bg">
            <div className="auth-form-container">
                <h2 className="auth-form-title">Login</h2>
                <form className="auth-form" onSubmit={(e) => handleSubmit(e, onSubmit)}>
                    <div className="input-group">
                        {errors.username && <div className="error-msg">{errors.username}</div>}
                        <input
                            className='auth-form-input'
                            type="text"
                            name="username"
                            value={values.username}
                            onChange={handleChange}
                            placeholder="Username"
                        />
                    </div>
                    <div className="input-group">
                        {errors.password && <div className="error-msg">{errors.password}</div>}
                        <input
                            className='auth-form-input'
                            type="password"
                            name="password"
                            value={values.password}
                            onChange={handleChange}
                            placeholder="Password"
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
