import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { UserProvider, useUser } from "./UserContext";
import { refreshTokenRequest, revokeTokenRequest } from "../services/authService";
import { registerAuthInterceptor, setAccessToken } from "../utils/http";

// Mock dependencies
jest.mock("../services/authService");
jest.mock("../utils/http");

// Helper component to consume context
const TestComponent = () => {
    const { user, loadingUser, login, logout } = useUser();

    if (loadingUser) return <div>Loading...</div>;

    return (
        <div>
            <div data-testid="user-id">{user?.id}</div>
            <div data-testid="username">{user?.username}</div>
            <button onClick={() => login("123", "testuser", "token123")}>Login</button>
            <button onClick={logout}>Logout</button>
        </div>
    );
};

describe("UserContext", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();

        // Default mock behaviors
        registerAuthInterceptor.mockImplementation((fn) => fn); // just run the interceptor logic if called
        setAccessToken.mockImplementation(() => { });
    });

    test("initializes with loading state and checks refresh token", async () => {
        // Mock successful refresh
        refreshTokenRequest.mockResolvedValue({
            ok: true,
            data: { id: "1", username: "initUser", token: "initToken" }
        });

        render(
            <UserProvider>
                <TestComponent />
            </UserProvider>
        );

        // Should start loading
        expect(screen.getByText("Loading...")).toBeInTheDocument();

        // Should eventually resolve
        await waitFor(() => expect(screen.queryByText("Loading...")).not.toBeInTheDocument());

        expect(screen.getByTestId("username")).toHaveTextContent("initUser");
        expect(refreshTokenRequest).toHaveBeenCalledTimes(1);
        expect(setAccessToken).toHaveBeenCalledWith("initToken");
    });

    test("handles failed initialization (logged out)", async () => {
        refreshTokenRequest.mockResolvedValue({ ok: false });

        render(
            <UserProvider>
                <TestComponent />
            </UserProvider>
        );

        await waitFor(() => expect(screen.queryByText("Loading...")).not.toBeInTheDocument());

        expect(screen.getByTestId("username")).toBeEmptyDOMElement();
        expect(setAccessToken).toHaveBeenCalledWith(null);
    });

    test("login updates state and localStorage", async () => {
        refreshTokenRequest.mockResolvedValue({ ok: false }); // Start logged out

        render(
            <UserProvider>
                <TestComponent />
            </UserProvider>
        );

        await waitFor(() => expect(screen.queryByText("Loading...")).not.toBeInTheDocument());

        const loginBtn = screen.getByText("Login");
        await act(async () => {
            loginBtn.click();
        });

        expect(screen.getByTestId("username")).toHaveTextContent("testuser");
        expect(localStorage.getItem("user")).toContain("testuser");
    });

    test("logout calls service and clears state", async () => {
        // Start logged in
        refreshTokenRequest.mockResolvedValue({
            ok: true,
            data: { id: "1", username: "loggedUser", token: "abc" }
        });
        revokeTokenRequest.mockResolvedValue({ ok: true });

        render(
            <UserProvider>
                <TestComponent />
            </UserProvider>
        );

        await waitFor(() => expect(screen.getByTestId("username")).toHaveTextContent("loggedUser"));

        const logoutBtn = screen.getByText("Logout");
        await act(async () => {
            logoutBtn.click();
        });

        expect(revokeTokenRequest).toHaveBeenCalled();
        expect(screen.getByTestId("username")).toBeEmptyDOMElement();
        expect(localStorage.getItem("user")).toBeNull();
    });
});
