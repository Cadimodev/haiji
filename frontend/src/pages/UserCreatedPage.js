import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import "../styles/UserCreatedPage.css";

function UserCreatedPage() {
    const { login, user, loadingUser } = useUser();
    const location = useLocation();
    const navigate = useNavigate();
    const [finalising, setFinalising] = useState(true);

    useEffect(() => {
        if (loadingUser) return;

        if (user) {
            setFinalising(false);
            return;
        }

        const payload = location.state;
        if (payload?.token && payload?.username) {
            login(payload.username, payload.token ?? "");
            setFinalising(false);
        } else {
            navigate("/register", { replace: true });
        }
    }, [loadingUser, user, location.state, login, navigate]);

    return (
        <div className="success-container">
            <h2>Registration Successful!</h2>
            <p>Thank you for creating your account.</p>
            {finalising && <p className="subtle-hint">Finalising your session…</p>}

            <div className="fireworks-container">
                <div className="firework"></div>
                <div className="firework"></div>
                <div className="firework"></div>
            </div>
        </div>
    );
}

export default UserCreatedPage;
