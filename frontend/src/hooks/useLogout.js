import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

export function useLogout() {
    const navigate = useNavigate();
    const { logout } = useUser();

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return handleLogout;
}
