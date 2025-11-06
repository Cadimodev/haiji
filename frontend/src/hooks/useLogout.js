import { useCallback } from "react";
import { useUser } from "../context/UserContext";

export function useLogout() {
    const { logout } = useUser();

    const handleLogout = useCallback(() => {
        logout();
    }, [logout]);

    return handleLogout;
}
