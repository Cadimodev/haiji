import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AuthForm.css";
import "../styles/KanaBattleLandingPage.css";

function KanaBattleLandingPage() {
    const navigate = useNavigate();

    const [joinCode, setJoinCode] = useState("");
    const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
    const [duration, setDuration] = useState(60);
    const [selectedGroups, setSelectedGroups] = useState({
        basic: true,
        dakuten: false,
        combo: false,
    });

    const handleToggleGroup = (key) => {
        setSelectedGroups((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handleCreateRoom = (e) => {
        e.preventDefault();

        // Aquí más adelante llamarás a tu backend:
        // POST /api/kana-battle con { duration, selectedGroups }
        // y luego navigate(`/kana-battle/${code}`)

        console.log("Create room with:", { duration, selectedGroups });
        alert("TODO: conectar con backend para crear sala.");
    };

    const handleJoinRoom = (e) => {
        e.preventDefault();
        const trimmed = joinCode.trim().toUpperCase();

        if (!trimmed) {
            return;
        }

        // Más adelante: validar código con backend o directamente navegar
        // navigate(`/kana-battle/${trimmed}`);

        console.log("Join room:", trimmed);
        alert(`TODO: conectar con backend para unirse a la sala ${trimmed}.`);
    };

    return (
        <main className="kana-battle-page">
            <section className="kana-battle-hero">
                <div className="kana-battle-hero-bg" />
                <div className="kana-battle-hero-content">
                    <h1 className="kana-battle-title">
                        Kana Battle
                    </h1>
                    <p className="kana-battle-subtitle">
                        Real-time Hiragana challenge with your friends.
                    </p>
                    <p className="kana-battle-tagline">
                        Create a room, share the code, and see who masters the kana in 60 seconds.
                    </p>
                </div>
            </section>

            <section className="kana-battle-main">
                <div className="kana-battle-cards">
                    {/* CREATE ROOM CARD */}
                    <article className="kana-battle-card">
                        <div className="kana-battle-card-header">
                            <div className="kana-battle-card-label">Host</div>
                            <h2 className="kana-battle-card-title">Create Room</h2>
                            <p className="kana-battle-card-desc">
                                Configure the kana groups, generate a room code, and invite your friends.
                            </p>
                        </div>

                        <form className="kana-battle-form" onSubmit={handleCreateRoom}>
                            <div className="kana-battle-form-group">
                                <label className="kana-battle-label">
                                    Duration
                                </label>
                                <select
                                    className="kana-battle-select"
                                    value={duration}
                                    onChange={(e) => setDuration(Number(e.target.value))}
                                >
                                    <option value={30}>30 seconds</option>
                                    <option value={60}>60 seconds</option>
                                    <option value={90}>90 seconds</option>
                                </select>
                            </div>

                            <div className="kana-battle-form-group kana-battle-config">
                                <button
                                    type="button"
                                    className="kana-battle-config-toggle"
                                    onClick={() => setShowAdvancedConfig((v) => !v)}
                                >
                                    Kana groups
                                    <span className={`kana-battle-config-icon ${showAdvancedConfig ? "open" : ""}`}>
                                        ▾
                                    </span>
                                </button>

                                {showAdvancedConfig && (
                                    <div className="kana-battle-groups">
                                        <label className="kana-battle-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={selectedGroups.basic}
                                                onChange={() => handleToggleGroup("basic")}
                                            />
                                            <span className="kana-battle-checkbox-label">
                                                Basic Hiragana (あ〜ん)
                                            </span>
                                        </label>
                                        <label className="kana-battle-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={selectedGroups.dakuten}
                                                onChange={() => handleToggleGroup("dakuten")}
                                            />
                                            <span className="kana-battle-checkbox-label">
                                                Dakuten (が, ざ, だ, ば, ぱ...)
                                            </span>
                                        </label>
                                        <label className="kana-battle-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={selectedGroups.combo}
                                                onChange={() => handleToggleGroup("combo")}
                                            />
                                            <span className="kana-battle-checkbox-label">
                                                Combinations (きゃ, しゃ, ちゃ...)
                                            </span>
                                        </label>
                                        <p className="kana-battle-groups-hint">
                                            You can map these options later to your existing practice groups.
                                        </p>
                                    </div>
                                )}
                            </div>
                            <button type="submit" className="submit-button big">
                                <span className="submit-button-lg">
                                    <span className="submit-button-sl"></span>
                                    <span className="submit-button-text">Create Battle</span>
                                </span>
                            </button>
                        </form>
                    </article>

                    {/* JOIN ROOM CARD */}
                    <article className="kana-battle-card">
                        <div className="kana-battle-card-header">
                            <div className="kana-battle-card-label player">Player</div>
                            <h2 className="kana-battle-card-title">Join Room</h2>
                            <p className="kana-battle-card-desc">
                                Enter the room code your friend shared and wait together in the lobby.
                            </p>
                        </div>

                        <form className="kana-battle-form" onSubmit={handleJoinRoom}>
                            <div className="kana-battle-form-group">
                                <label className="kana-battle-label" htmlFor="room-code">
                                    Room code
                                </label>
                                <input
                                    id="room-code"
                                    className="kana-battle-input"
                                    type="text"
                                    maxLength={12}
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    placeholder="e.g. AB4D2F"
                                />
                            </div>

                            <button
                                type="submit"
                                className="kana-battle-secondary-btn"
                                disabled={!joinCode.trim()}
                            >
                                Join Room
                            </button>
                        </form>
                    </article>
                </div>

                <section className="kana-battle-how-it-works">
                    <h3 className="kana-battle-how-title">How it works</h3>
                    <ol className="kana-battle-how-list">
                        <li>Select your kana groups and create a room.</li>
                        <li>Share the room code with your friends.</li>
                        <li>Everyone joins the lobby and sees who is connected.</li>
                        <li>The host starts the battle — you all get the same time limit.</li>
                        <li>Type the romaji as fast and accurately as you can.</li>
                        <li>When time is up, the final ranking appears for everyone.</li>
                    </ol>
                </section>
            </section>
        </main>
    );
}

export default KanaBattleLandingPage;
