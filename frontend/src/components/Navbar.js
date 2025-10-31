import { NavLink } from 'react-router-dom'
import '../styles/Navbar.css';

function Navbar() {
    return (
        <nav>
            <div>
                <NavLink to="/" end className="btn-flip" data-back="ホーム" data-front="Home">
                </NavLink>
                <NavLink to="/kana-chart" end className="btn-flip" data-back="グラフ" data-front="Chart">
                </NavLink>
                <NavLink to="/kana-practice" end className="btn-flip" data-back="練習" data-front="Practice">
                </NavLink>
                <NavLink to="/login" end className="btn-flip" data-back="ログイン" data-front="Login">
                </NavLink>
            </div>
        </nav>
    )
}

export default Navbar
