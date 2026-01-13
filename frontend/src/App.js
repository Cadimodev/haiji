import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import KanaChartPage from "./pages/KanaChartPage";
import KanaPracticePage from "./pages/KanaPracticePage";
import KanaBattleLandingPage from "./pages/KanaBattleLandingPage";
import KanaBattlePage from "./pages/KanaBattlePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UserCreatedPage from "./pages/UserCreatedPage";
import UserProfilePage from "./pages/UserProfilePage";
import Navbar from "./components/Navbar";
import { UserProvider } from "./context/UserContext";
import { ProtectedRoute, PublicOnlyRoute } from "./components/RouteGuards";
import "./styles/Common.css";

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/kana-chart" element={<KanaChartPage />} />
          <Route path="/kana-practice" element={<KanaPracticePage />} />
          <Route path="/kana-battle" element={<KanaBattleLandingPage />} />
          <Route path="/kana-battle/:roomCode" element={<KanaBattlePage />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />
          <Route path="/user-creation-success" element={<UserCreatedPage />} />
          <Route
            path="/user-profile"
            element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
