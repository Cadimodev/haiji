import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/KanaBattleLandingPage.css";

const GROUP_IDS = [
    "hsingle",
    "hk",
    "hs",
    "ht",
    "hn",
    "hh",
    "hm",
    "hy",
    "hr",
    "hw",
    "hn1",
    "hg",
    "hz",
    "hd",
    "hb",
    "hp",
];

const GROUP_LABELS = {
    hsingle: "あ-row",
    hk: "か-row",
    hs: "さ-row",
    ht: "た-row",
    hn: "な-row",
    hh: "は-row",
    hm: "ま-row",
    hy: "や-row",
    hr: "ら-row",
    hw: "わ-row",
    hn1: "ん",
    hg: "が-row",
    hz: "ざ-row",
    hd: "だ-row",
    hb: "ば-row",
    hp: "ぱ-row",
};


const BEGINNER_GROUPS = ["hsingle", "hk", "hs", "ht"];
const STANDARD_GROUPS = ["hsingle", "hk", "hs", "ht", "hn", "hh", "hm", "hy", "hr"];
const ALL_GROUPS = [...GROUP_IDS];

function KanaBattleLandingPage() {
    const navigate = useNavigate();

    const [joinCode, setJoinCode] = useState("");
    const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
    const [duration, setDuration] = useState(60);
    const [selectedGroups, setSelectedGroups] = useState({
        hsingle: true,
        hk: false,
        hs: false,
        ht: false,
        hn: false,
        hh: false,
        hm: false,
        hy: false,
        hr: false,
        hw: false,
        hn1: false,
        hg: false,
        hz: false,
        hd: false,
        hb: false,
        hp: false,
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

    const handleCreateRoom = (e) => {
        e.preventDefault();

        const activeGroupIds = GROUP_IDS.filter((id) => selectedGroups[id]);

        if (activeGroupIds.length === 0) {
            // por seguridad extra, aunque el guard de arriba ya evita esto
            alert("Please select at least one kana group.");
            return;
        }

        // POST /api/kana-battle con { duration, groups: activeGroupIds }
        // y luego navigate(`/kana-battle/${code}`)

        console.log("Create room with:", { duration, groups: activeGroupIds });
        alert("TODO: connect to backend to create a room with these groups (check console).");
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
        alert(`TODO: connect to backend to join room ${trimmed}.`);
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
                                        <div className="kana-battle-group-grid">
                                            {GROUP_IDS.map((id) => {
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
