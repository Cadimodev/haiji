import React from "react";
import { BrowserRouter as Router, Routes, Route, BrowserRouter } from "react-router-dom";
import HomePage from "./pages/HomePage";
import KanaChartPage from "./pages/KanaChartPage";
import KanaPracticePage from "./pages/KanaPracticePage";
import LoginPage from "./pages/LoginPage";
import Navbar from "./components/Navbar.js";
import './styles/Common.css';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/kana-chart" element={<KanaChartPage />} />
        <Route path="/kana-practice" element={<KanaPracticePage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;