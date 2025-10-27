import React from "react";
import { Link } from "react-router-dom";

function KanaChartPage() {
    return (
        <div>
            <h1>Hiragana & Katakana Chart</h1>
            <img src="/assets/hiragana_katakana.png" alt="Hiragana & Katakana Chart" style={{ maxWidth: "100%", height: "auto" }} />
            <br />
            <Link to="/">Back to HomePage</Link>
        </div>
    );
}

export default KanaChartPage;
