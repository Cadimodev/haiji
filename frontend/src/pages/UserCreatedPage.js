import React from "react";
import { NavLink } from 'react-router-dom'
import "../styles/UserCreatedPage.css";

function UserCreatedPage() {
    return (
        <div className="success-container">
            <h2>Registration Successful!</h2>
            <p>Thank you for creating your account.</p>
            <NavLink to="/login" end className="haiji-link" >Back to Login</NavLink>
            <div className="fireworks-container">
                <div class="firework"></div>
                <div class="firework"></div>
                <div class="firework"></div>
            </div>
        </div>
    );
}

export default UserCreatedPage;
