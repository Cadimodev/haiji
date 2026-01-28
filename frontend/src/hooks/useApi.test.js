import { renderHook } from "@testing-library/react";
import { useApi } from "./useApi";
import { useUser } from "../context/UserContext";
import { httpRequest } from "../utils/http";

// Mock dependencies
jest.mock("../context/UserContext");
jest.mock("../utils/http");

describe("useApi", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // 1. Test authenticatedRequest logic (indirectly via services)
    describe("when user is NOT logged in", () => {
        beforeEach(() => {
            useUser.mockReturnValue({ user: null });
        });

        test("getUserProfile aborts and returns 401 error", async () => {
            const { result } = renderHook(() => useApi());

            const response = await result.current.getUserProfile();

            expect(httpRequest).not.toHaveBeenCalled();
            expect(response).toEqual({
                ok: false,
                status: 401,
                data: null,
                error: "No active session"
            });
        });
    });

    describe("when user IS logged in", () => {
        const mockUser = { token: "fake-jwt-token" };

        beforeEach(() => {
            useUser.mockReturnValue({ user: mockUser });
            httpRequest.mockResolvedValue({ ok: true, data: "success" });
        });

        test("getUserProfile calls correct endpoint with header", async () => {
            const { result } = renderHook(() => useApi());

            await result.current.getUserProfile();

            expect(httpRequest).toHaveBeenCalledWith("/api/user-profile", {
                method: "GET",
                headers: {
                    Authorization: "Bearer fake-jwt-token"
                }
            });
        });

        test("updateUserProfile calls PUT with body", async () => {
            const { result } = renderHook(() => useApi());
            const payload = { username: "new_name" };

            await result.current.updateUserProfile(payload);

            expect(httpRequest).toHaveBeenCalledWith("/api/users", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer fake-jwt-token"
                },
                body: JSON.stringify(payload)
            });
        });

        test("createBattleRoom calls POST with correct body", async () => {
            const { result } = renderHook(() => useApi());

            await result.current.createBattleRoom(60, ["hiragana"]);

            expect(httpRequest).toHaveBeenCalledWith("/api/kana-battle", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer fake-jwt-token"
                },
                body: JSON.stringify({ duration: 60, groups: ["hiragana"] })
            });
        });
    });
});
