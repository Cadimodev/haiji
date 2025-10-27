import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import KanaChartPage from "./pages/KanaChartPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/kana-chart" element={<KanaChartPage />} />
      </Routes>
    </Router>
  );
}

export default App;