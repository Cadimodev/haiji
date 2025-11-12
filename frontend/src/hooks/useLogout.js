import { useUser } from "../context/UserContext";
import { revokeTokenRequest } from "../services/authService";

export function useLogout() {
    const { user, logout } = useUser();

    return async function doLogout() {
        try {
            if (user?.refreshToken) {
                await revokeTokenRequest(user.refreshToken);
            }
        } catch (_) {

        } finally {
            logout();
        }
    };
}
