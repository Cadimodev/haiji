import { useUser } from "../context/UserContext";

export function useLogout() {
    const { logout } = useUser();

    return logout;
}