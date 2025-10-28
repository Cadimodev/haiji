import React from "react";
import { Link } from "react-router-dom";

function HomePage() {
    return (
        <div>
            <h1>Welcome to Haiji</h1>
            <Link to="/kana-chart">Kana Chart</Link>
            <br />
            <Link to="/kana-practice">Kana Practice</Link>
        </div>
    );
}

export default HomePage;
