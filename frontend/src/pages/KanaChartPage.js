import React from "react";
import kanaChart from "../assets/kana-chartV3.jpg";
import "../styles/KanaChartPage.css";

function KanaChartPage() {
    return (
        <div className="kana-chart-page">
            <h1 className="kana-chart-header">Hiragana & Katakana Chart</h1>
            <div className="kana-chart-container">
                <img
                    src={kanaChart}
                    alt="Hiragana & Katakana Chart"
                    className="kana-chart-image"
                />
            </div>
        </div>
    );
}

export default KanaChartPage;
