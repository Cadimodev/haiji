import { NavLink } from 'react-router-dom'
import '../styles/Navbar.css';

function Navbar() {
    return (
        <nav>
            <div className="nav-links">
                <NavLink to="/" end className={({ isActive }) => (isActive ? 'active-link' : '')}>
                    Home
                </NavLink>
                <NavLink to="/kana-chart" className={({ isActive }) => (isActive ? 'active-link' : '')}>
                    Kana Chart
                </NavLink>
                <NavLink to="/kana-practice" className={({ isActive }) => (isActive ? 'active-link' : '')}>
                    Practice
                </NavLink>
                <NavLink to="/login" className={({ isActive }) => (isActive ? 'active-link' : '')}>
                    Login
                </NavLink>
            </div>
            {/*
            <div className="nav-buttons">
                <button className="btn">Book now</button>
                <button className="btn">Apply now</button>
                <button className="btn">Join waitlist</button>
            </div>
            */}
        </nav>
    )
}

export default Navbar
