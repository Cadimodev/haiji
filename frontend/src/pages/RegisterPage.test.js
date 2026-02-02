import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegisterPage from "./RegisterPage";
import { UserProvider } from "../context/UserContext";
import { registerRequest } from "../services/authService";
import { BrowserRouter } from "react-router-dom";

// Mock authService
jest.mock("../services/authService", () => ({
    registerRequest: jest.fn(),
    refreshTokenRequest: () => Promise.resolve({ ok: false }),
    revokeTokenRequest: jest.fn(),
}));

// Mock useNavigate
const mockedNavigator = jest.fn();
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockedNavigator,
}));

describe("RegisterPage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    const renderWithContext = () => {
        render(
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <UserProvider>
                    <RegisterPage />
                </UserProvider>
            </BrowserRouter>
        );
    };

    test("renders register form correctly", async () => {
        renderWithContext();

        expect(await screen.findByPlaceholderText(/Username/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Register/i })).toBeInTheDocument();
    });

    test("handles valid registration successfully", async () => {
        registerRequest.mockResolvedValue({
            ok: true,
            data: {
                token: "fake-jwt",
                id: "2",
                username: "newuser"
            }
        });

        renderWithContext();

        const usernameInput = await screen.findByPlaceholderText(/Username/i);
        fireEvent.change(usernameInput, { target: { value: "newuser" } });
        fireEvent.change(screen.getByPlaceholderText(/Email/i), { target: { value: "test@example.com" } });
        fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: "securepass" } });

        const signupBtn = screen.getByRole("button", { name: /Register/i });
        fireEvent.click(signupBtn);

        await waitFor(() => {
            expect(registerRequest).toHaveBeenCalledWith({
                username: "newuser",
                email: "test@example.com",
                password: "securepass"
            });
            // Assume redirection to success page with data
            expect(mockedNavigator).toHaveBeenCalledWith("/user-creation-success", {
                replace: true,
                state: {
                    id: "2",
                    username: "newuser",
                    token: "fake-jwt"
                }
            });
        });
    });

    test("displays error on failed registration", async () => {
        registerRequest.mockResolvedValue({
            ok: false,
            error: "Username taken"
        });

        renderWithContext();

        const usernameInput = await screen.findByPlaceholderText(/Username/i);
        fireEvent.change(usernameInput, { target: { value: "takenuser" } });
        fireEvent.change(screen.getByPlaceholderText(/Email/i), { target: { value: "test@example.com" } });
        fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: "password123" } });

        fireEvent.click(screen.getByRole("button", { name: /Register/i }));

        await waitFor(() => {
            expect(screen.getByText(/Username taken/i)).toBeInTheDocument();
        });
    });

    test("validates email format", async () => {
        renderWithContext();

        const usernameInput = await screen.findByPlaceholderText(/Username/i); // wait for load
        const emailInput = screen.getByPlaceholderText(/Email/i);

        fireEvent.change(emailInput, { target: { value: "invalid-email" } });
        fireEvent.blur(emailInput); // Trigger validation if onBlur used, or just wait if realtime

        // Assuming validation happens on change or blur and shows error
        await waitFor(() => {
            // Adapt text based on validation library or manual check logic
            // Common message: "Invalid email address" or similar
            // We'll check if any error appears nearby or preventing submission
        });

        // If validation prevents submission:
        const signupBtn = screen.getByRole("button", { name: /Register/i });
        fireEvent.click(signupBtn);

        await waitFor(() => {
            expect(registerRequest).not.toHaveBeenCalled();
            // Optional: check for specific error text if known
            // expect(screen.getByText(/Invalid email/i)).toBeInTheDocument();
        });
    });
});
