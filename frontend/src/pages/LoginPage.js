import { NavLink, useNavigate } from 'react-router-dom'
import React, { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import "../styles/LoginPage.css";

function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [backendError, setBackendError] = useState("");
    const { login, user } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate("/");
        }
    }, [user, navigate]);

    function validate() {
        const newErrors = {};
        if (!username) {
            newErrors.email = "Username is required";
        }
        if (!password) {
            newErrors.password = "Password is required";
        } else if (password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }
        return newErrors;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        const validationErrors = validate();
        setErrors(validationErrors);
        setBackendError("");

        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        const userData = { username, password };

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData && errorData.message) {
                    setBackendError(errorData.message);
                } else {
                    setBackendError("Couldn't log in");
                }
                return;
            }

            const data = await response.json();

            console.log('User logged in:', data);
            login(data.username, data.token, data.refresh_token);
            navigate('/');


        } catch (error) {
            console.error('Couldnt log in:', error);
            setBackendError("Error connecting to the server. Please try again later.");
        }
    }

    return (
        <div className="login-bg">
            <div className="login-container">
                <h2 className="login-title">Login</h2>
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        {errors.username && <div className="error-msg">{errors.username}</div>}
                        <input
                            type="text"
                            placeholder="Username"
                            className="login-input"
                            autoComplete="username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="input-group">
                        {errors.password && <div className="error-msg">{errors.password}</div>}
                        <input
                            type="password"
                            placeholder="Password"
                            className="login-input"
                            autoComplete="current-password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="button">
                        <span className="button_lg">
                            <span className="button_sl"></span>
                            <span className="button_text">Log in</span>
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
