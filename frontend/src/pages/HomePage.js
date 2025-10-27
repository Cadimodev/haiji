import React from "react";
import { Link } from "react-router-dom";

function HomePage() {
    return (
        <div>
            <h1>Welcome to Haiji</h1>
            <Link to="/kana-chart">Kana Chart</Link>
        </div>
    );
}

export default HomePage;
