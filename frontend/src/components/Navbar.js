import { NavLink } from 'react-router-dom'
import { useUser } from "../context/UserContext";
import { useLogout } from "../hooks/useLogout";
import '../styles/Navbar.css';

function Navbar() {
    const { user } = useUser();
    const handleLogout = useLogout();

    return (
        <nav>
            <div className="navbar-links-left">
                <NavLink to="/" end className="btn-flip" data-back="ホーム" data-front="HOME" />
                <NavLink to="/kana-chart" end className="btn-flip" data-back="グラフ" data-front="CHART" />
                <NavLink to="/kana-practice" end className="btn-flip" data-back="練習" data-front="PRACTICE" />
                <NavLink to="/kana-battle" end className="btn-flip" data-back="バトル" data-front="BATTLE" />
            </div>
            <div className="navbar-links-right">
                {user
                    ? (
                        <>
                            <NavLink to="/user-profile" end className="btn-flip" data-back={user.username} data-front={user.username} />
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="logout-icon"
                                style={{ marginLeft: "12px", verticalAlign: "middle" }}
                                onClick={handleLogout}
                            >
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </>
                    )
                    : <NavLink to="/login" end className="btn-flip" data-back="ログイン" data-front="LOGIN" />
                }
            </div>
        </nav>
    )
}
export default Navbar;
