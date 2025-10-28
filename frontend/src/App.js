import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import KanaChartPage from "./pages/KanaChartPage";
import KanaPracticePage from "./pages/KanaPracticePage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/kana-chart" element={<KanaChartPage />} />
        <Route path="/kana-practice" element={<KanaPracticePage />} />
      </Routes>
    </Router>
  );
}

export default App;