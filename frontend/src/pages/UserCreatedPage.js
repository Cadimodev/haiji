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

        // Si ya hay sesión (por ejemplo, por localStorage tras refresh), listo
        if (user) {
            setFinalising(false);
            return;
        }

        const payload = location.state; // { username, token, refresh }
        if (payload?.token && payload?.username) {
            login(payload.username, payload.token, payload.refresh ?? "");
            setFinalising(false);
        } else {
            // Acceso directo a la URL sin pasar por Register
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
