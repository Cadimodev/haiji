import React from "react";
import kanaChart from "../assets/hiragana_katakana.png";

function KanaChartPage() {
    return (
        <div className="main-block">
            <h1>Hiragana & Katakana Chart</h1>
            <img src={kanaChart} alt="Hiragana & Katakana Chart" style={{ maxWidth: "100%", height: "auto" }} />
        </div>
    );
}

export default KanaChartPage;
