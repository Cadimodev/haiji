import React from "react";
import "../styles/LoginPage.css";

function LoginPage() {
    return (
        <div className="login-bg">
            <div className="login-container">
                <h2 className="login-title">Login</h2>
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
                    <button type="submit" class="button">
                        <span class="button_lg">
                            <span class="button_sl"></span>
                            <span class="button_text">Login</span>
                        </span>
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
