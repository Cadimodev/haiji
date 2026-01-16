import React from 'react';
import { useNavigate } from 'react-router-dom';
import SakuraCanvas from '../components/SakuraCanvas';
import EnsoImage from '../assets/enso-brush.png';
import '../styles/HomePage.css';

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="homepage-container">
            <SakuraCanvas />

            <section className="hero-section">
                <div className="enso-container">
                    <svg className="enso-svg" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <mask id="ensoMask">
                                {/* The image acts as a luminance mask: White=Visible, Black=Transparent */}
                                <image href={EnsoImage} width="100%" height="100%" x="0" y="0" />
                            </mask>
                        </defs>
                        {/* A white rectangle masked by the Enso image. Result is a white Enso. */}
                        <rect width="100%" height="100%" fill="white" mask="url(#ensoMask)" />
                    </svg>
                    <div className="enso-content">
                        <h1 className="kanji-title">灰二</h1>
                        <h2 className="romaji-subtitle">Haiji</h2>
                    </div>
                </div>
            </section>
            <section className="features-section">
                <div className="feature-card" onClick={() => navigate('/kana-chart')}>
                    <div className="feature-icon">あ</div>
                    <h3>Kana Chart</h3>
                    <p>Master Hiragana & Katakana with interactive charts.</p>
                </div>

                <div className="feature-card" onClick={() => navigate('/kana-practice')}>
                    <div className="feature-icon">✍️</div>
                    <h3>Practice</h3>
                    <p>Hone your skills with guided writing and quizzes.</p>
                </div>

                <div className="feature-card" onClick={() => navigate('/kana-battle')}>
                    <div className="feature-icon">⚔️</div>
                    <h3>Battle</h3>
                    <p>Test your speed and accuracy in real-time duels.</p>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
