import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import "../styles/LoginPage.css";

function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [errors, setErrors] = useState({});
    const [backendError, setBackendError] = useState("");
    const navigate = useNavigate();

    function validate() {
        const newErrors = {};
        if (!email) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Email is invalid";
        }
        if (!username) {
            newErrors.password = "Username is required";
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

        const userData = { email, username, password };

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData && errorData.message) {
                    setBackendError(errorData.message);
                } else {
                    setBackendError("Couldn't create user");
                }
                return;
            }

            const data = await response.json();

            console.log('User created:', data);
            navigate('/user-creation-success');


        } catch (error) {
            console.error('Couldnt create user:', error);
            setBackendError("Error connecting to the server. Please try again later.");
        }
    }

    return (
        <div className="login-bg">
            <div className="login-container">
                <h2 className="register-title">Register</h2>
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        {errors.email && <div className="error-msg">{errors.email}</div>}
                        <input
                            type="text"
                            placeholder="Email"
                            className="login-input"
                            autoComplete="username"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
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
                            <span className="button_text">Register</span>
                        </span>
                    </button>
                    {backendError && <div className="backend-error-msg">{backendError}</div>}
                </form>
            </div>
        </div>
    );
}

export default RegisterPage;
