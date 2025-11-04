import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import KanaChartPage from "./pages/KanaChartPage";
import KanaPracticePage from "./pages/KanaPracticePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UserCreatedPage from "./pages/UserCreatedPage";
import Navbar from "./components/Navbar";
import { UserProvider } from "./context/UserContext";
import './styles/Common.css';

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/kana-chart" element={<KanaChartPage />} />
          <Route path="/kana-practice" element={<KanaPracticePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/user-creation-success" element={<UserCreatedPage />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;