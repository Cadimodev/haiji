import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthManager } from "../hooks/useAuthManager";
import "../styles/KanaBattleLandingPage.css";
import {
    GROUP_IDS,
    GROUP_LABELS,
    BASIC_HIRAGANA_GROUPS,
    BASIC_KATAKANA_GROUPS,
    COMBINATION_HIRAGANA_GROUPS
} from "../utils/kanaData";


const BEGINNER_GROUPS = ["hsingle", "hk", "hs", "ht", "ksingle", "kk", "ks", "kt"];
const STANDARD_GROUPS = ["hsingle", "hk", "hs", "ht", "hn", "hh", "hm", "hy", "hr", "ksingle", "kk", "ks", "kt", "kn", "kh", "km", "ky", "kr"];
const ALL_GROUPS = [...GROUP_IDS];

function KanaBattleLandingPage() {
    const { fetchJsonWithAuth } = useAuthManager();
    const navigate = useNavigate();

    const [joinCode, setJoinCode] = useState("");
    const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
    const [duration, setDuration] = useState(60);
    const [selectedGroups, setSelectedGroups] = useState(() => {
        const initial = {};
        GROUP_IDS.forEach(id => {
            initial[id] = id === "hsingle";
        });
        return initial;
    });

    const handleToggleGroup = (key) => {
        setSelectedGroups((prev) => {
            const next = { ...prev, [key]: !prev[key] };
            if (!Object.values(next).some(Boolean)) {
                next.hsingle = true;
            }

            return next;
        });
    };

    const applyPreset = (preset) => {
        let active;
        switch (preset) {
            case "beginner":
                active = new Set(BEGINNER_GROUPS);
                break;
            case "standard":
                active = new Set(STANDARD_GROUPS);
                break;
            case "all":
                active = new Set(ALL_GROUPS);
                break;
            default:
                active = new Set(["hsingle"]);
        }

        const next = {};
        GROUP_IDS.forEach((id) => {
            next[id] = active.has(id);
        });
        setSelectedGroups(next);
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();

        const activeGroupIds = GROUP_IDS.filter((id) => selectedGroups[id]);

        if (activeGroupIds.length === 0) {
            alert("Please select at least one kana group.");
            return;
        }

        const { ok, data } = await fetchJsonWithAuth("http://localhost:8080/api/kana-battle", {
            method: "POST",
            body: JSON.stringify({
                duration,
                groups: activeGroupIds
            })
        });

        if (ok && data.code) {
            navigate(`/kana-battle/${data.code}`);
        } else {
            alert("Failed to create room.");
        }
    };

    const handleJoinRoom = (e) => {
        e.preventDefault();
        const trimmed = joinCode.trim().toUpperCase();

        if (!trimmed) {
            return;
        }

        navigate(`/kana-battle/${trimmed}`);
    };

    const selectedCount = GROUP_IDS.filter((id) => selectedGroups[id]).length;

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
                    <article className="kana-battle-card">
                        <div className="kana-battle-card-header">
                            <div className="kana-battle-card-label">HOST</div>
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
                                    <span className="kana-battle-config-selected">
                                        {selectedCount} selected
                                    </span>
                                    <span
                                        className={`kana-battle-config-icon ${showAdvancedConfig ? "open" : ""
                                            }`}
                                    >
                                        ▾
                                    </span>
                                </button>

                                {showAdvancedConfig && (
                                    <div className="kana-battle-groups">
                                        <div className="kana-battle-groups-presets">
                                            <span className="kana-battle-groups-presets-label">
                                                Preset:
                                            </span>
                                            <button
                                                type="button"
                                                className="kana-battle-preset-btn"
                                                onClick={() => applyPreset("beginner")}
                                            >
                                                Beginner
                                            </button>
                                            <button
                                                type="button"
                                                className="kana-battle-preset-btn"
                                                onClick={() => applyPreset("standard")}
                                            >
                                                Standard
                                            </button>
                                            <button
                                                type="button"
                                                className="kana-battle-preset-btn"
                                                onClick={() => applyPreset("all")}
                                            >
                                                All
                                            </button>
                                        </div>
                                        <div className="kana-battle-group-section">
                                            <h4 className="kana-battle-group-title">Basic Hiragana</h4>
                                            <div className="kana-battle-group-grid">
                                                {BASIC_HIRAGANA_GROUPS.map((id) => {
                                                    const active = !!selectedGroups[id];
                                                    return (
                                                        <button
                                                            key={id}
                                                            type="button"
                                                            className={
                                                                "kana-battle-group-pill" +
                                                                (active ? " active" : "")
                                                            }
                                                            onClick={() => handleToggleGroup(id)}
                                                        >
                                                            <span className="kana-battle-group-indicator" />
                                                            <span className="kana-battle-group-label">
                                                                {GROUP_LABELS[id] || id.toUpperCase()}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="kana-battle-group-section" style={{ marginTop: '1.5rem' }}>
                                            <h4 className="kana-battle-group-title">Basic Katakana</h4>
                                            <div className="kana-battle-group-grid">
                                                {BASIC_KATAKANA_GROUPS.map((id) => {
                                                    const active = !!selectedGroups[id];
                                                    return (
                                                        <button
                                                            key={id}
                                                            type="button"
                                                            className={
                                                                "kana-battle-group-pill" +
                                                                (active ? " active" : "")
                                                            }
                                                            onClick={() => handleToggleGroup(id)}
                                                        >
                                                            <span className="kana-battle-group-indicator" />
                                                            <span className="kana-battle-group-label">
                                                                {GROUP_LABELS[id] || id.toUpperCase()}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="kana-battle-group-section" style={{ marginTop: '1.5rem' }}>
                                            <h4 className="kana-battle-group-title">Hiragana Combinations (Yoon)</h4>
                                            <div className="kana-battle-group-grid">
                                                {COMBINATION_HIRAGANA_GROUPS.map((id) => {
                                                    const active = !!selectedGroups[id];
                                                    return (
                                                        <button
                                                            key={id}
                                                            type="button"
                                                            className={
                                                                "kana-battle-group-pill" +
                                                                (active ? " active" : "")
                                                            }
                                                            onClick={() => handleToggleGroup(id)}
                                                        >
                                                            <span className="kana-battle-group-indicator" />
                                                            <span className="kana-battle-group-label">
                                                                {GROUP_LABELS[id] || id.toUpperCase()}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <p className="kana-battle-groups-hint">
                                            These groups match the Hiragana groups used in the Practice page.
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
                    <article className="kana-battle-card">
                        <div className="kana-battle-card-header">
                            <div className="kana-battle-card-label player">PLAYER</div>
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
