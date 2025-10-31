import React from "react";
import "../styles/LoginPage.css";

function LoginPage() {
    return (
        <div className="login-bg">
            <div className="login-container">
                <h2 className="login-title">Log in</h2>
                <form className="login-form">
                    <input
                        type="email"
                        placeholder="Email"
                        className="login-input"
                        autoComplete="username"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="login-input"
                        autoComplete="current-password"
                    />
                    <button type="submit" className="login-btn">
                        Log in
                    </button>
                </form>
                <a className="login-forgot" href="/forgot-password">
                    Forgot password?
                </a>
            </div>
        </div>
    );
}

export default LoginPage;
