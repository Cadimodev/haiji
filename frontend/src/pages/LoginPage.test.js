import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "./LoginPage";
import { UserProvider } from "../context/UserContext";
import { loginRequest } from "../services/authService";
import { BrowserRouter } from "react-router-dom";

// Mock authService
jest.mock("../services/authService", () => ({
    loginRequest: jest.fn(),
    refreshTokenRequest: () => Promise.resolve({ ok: false }),
    revokeTokenRequest: jest.fn(),
}));

// Mock useNavigate
const mockedNavigator = jest.fn((...args) => console.log("NAVIGATE CALLED:", args));
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockedNavigator,
}));

describe("LoginPage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    const renderWithContext = () => {
        render(
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <UserProvider>
                    <LoginPage />
                </UserProvider>
            </BrowserRouter>
        );
    };

    test("renders login form correctly", async () => {
        renderWithContext();

        expect(await screen.findByPlaceholderText(/Username/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Log in/i })).toBeInTheDocument();
    });

    test("handles valid submission successfully", async () => {
        loginRequest.mockResolvedValue({
            ok: true,
            data: {
                token: "fake-jwt",
                id: "1",
                username: "testuser"
            }
        });

        renderWithContext();

        const usernameInput = await screen.findByPlaceholderText(/Username/i);
        fireEvent.change(usernameInput, { target: { value: "testuser" } });
        fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: "password123" } });

        const loginBtn = screen.getByRole("button", { name: /Log in/i });
        fireEvent.click(loginBtn);

        await waitFor(() => {
            expect(loginRequest).toHaveBeenCalledWith({
                username: "testuser",
                password: "password123"
            });
            // Check redirect
            expect(mockedNavigator).toHaveBeenCalledWith("/", { replace: true });
        });
    });

    test("displays error on failed login", async () => {
        loginRequest.mockResolvedValue({
            ok: false,
            error: "Invalid credentials"
        });

        renderWithContext();

        const usernameInput = await screen.findByPlaceholderText(/Username/i);
        fireEvent.change(usernameInput, { target: { value: "wronguser" } });
        fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: "wrongpass" } });

        fireEvent.click(screen.getByRole("button", { name: /Log in/i }));

        await waitFor(() => {
            expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
        });
    });
});
