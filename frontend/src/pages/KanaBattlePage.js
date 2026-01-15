import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { charGroups, getRandomIndex } from "../utils/kanaData";
import "../styles/KanaBattleLandingPage.css"; // Reuse for now
import "../styles/KanaPracticePage.css"; // Reuse card styles
import "../styles/KanaBattlePage.css"; // Specific Battle styles

function KanaBattlePage() {
    const { roomCode } = useParams();
    const { user, loadingUser } = useUser();
    const navigate = useNavigate();

    // Game State
    const [gameState, setGameState] = useState("CONNECTING"); // CONNECTING, LOBBY, PLAYING, FINISHED
    const [players, setPlayers] = useState({});
    const [config, setConfig] = useState(null);
    const [hostId, setHostId] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [error, setError] = useState("");

    // Socket
    const socketRef = useRef(null);

    // Game Logic State
    const [definitions, setDefinitions] = useState([]); // Array of {kana, romanji}
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userInput, setUserInput] = useState("");
    const [score, setScore] = useState(0);
    const [showRomanji, setShowRomanji] = useState(false); // Hover state

    const inputRef = useRef(null);

    // Initial Connection
    useEffect(() => {
        if (loadingUser) return;
        if (!user || !user.token) {
            navigate("/login");
            return;
        }

        if (socketRef.current) return;

        // Connect
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws?token=${user.token}`;

        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
            console.log("Connected to WS");
            // Join Room
            const joinMsg = {
                type: "JOIN_ROOM",
                code: roomCode.toUpperCase()
            };
            console.log("Sending JOIN_ROOM:", joinMsg);
            ws.send(JSON.stringify(joinMsg));
        };

        ws.onmessage = (event) => {
            console.log("WS Message received:", event.data);
            const msg = JSON.parse(event.data);
            handleMessage(msg);
        };

        ws.onclose = () => {
            console.log("Disconnected");
            // Optionally handle reconnect or show error
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
            socketRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, loadingUser, roomCode]);

    const handleMessage = (msg) => {
        switch (msg.type) {
            case "ERROR":
                setError(msg.message);
                setGameState("ERROR");
                break;
            case "ROOM_STATE":
                setPlayers(msg.players);
                setConfig(msg.config);
                if (msg.hostId) setHostId(msg.hostId);

                if (msg.state === "WAITING") setGameState("LOBBY");
                if (msg.state === "PLAYING") setGameState("PLAYING");
                if (msg.state === "FINISHED") setGameState("FINISHED");

                // Initialize Game Pool if config is present
                if (msg.config && msg.config.groups) {
                    const pool = msg.config.groups.flatMap(id => charGroups[id] || []);
                    setDefinitions(pool);
                }
                break;
            case "GAME_STARTED":
                setGameState("PLAYING");
                setEndTime(new Date(msg.endTime));
                setScore(0);
                setCurrentIndex(0); // Randomize?
                // Focus input
                setTimeout(() => inputRef.current?.focus(), 100);
                break;
            case "SCORE_UPDATE":
                setPlayers(msg.players);
                break;
            case "GAME_OVER":
                setGameState("FINISHED");
                setPlayers(msg.players);
                break;
            default:
                break;
        }
    };

    // Timer Effect
    useEffect(() => {
        if (gameState !== "PLAYING" || !endTime) return;

        const interval = setInterval(() => {
            const now = new Date();
            const diff = Math.ceil((endTime - now) / 1000);
            if (diff <= 0) {
                setTimeLeft(0);
                clearInterval(interval);
            } else {
                setTimeLeft(diff);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [gameState, endTime]);


    const handleStartGame = () => {
        if (socketRef.current) {
            socketRef.current.send(JSON.stringify({ type: "START_GAME" }));
        }
    };

    const submitScore = (newScore) => {
        if (socketRef.current) {
            socketRef.current.send(JSON.stringify({ type: "SUBMIT_SCORE", score: newScore }));
        }
    }

    // Input Logic
    const handleInputChange = (e) => {
        const val = e.target.value;
        setUserInput(val);

        if (definitions.length === 0) return;

        const current = definitions[currentIndex];
        if (val.trim().toLowerCase() === current.romanji) {
            // Correct
            const newScore = score + 1;
            setScore(newScore);
            setUserInput("");
            setShowRomanji(false);
            submitScore(newScore);
            setCurrentIndex(getRandomIndex(currentIndex, definitions.length));
        }
    };

    if (loadingUser) return <div>Loading...</div>;
    if (gameState === "ERROR") return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="kana-battle-page">
            <h1 className="battle-room-header">Room: {roomCode}</h1>

            {gameState === "CONNECTING" && <div className="text-white text-center">Connecting...</div>}

            {gameState === "LOBBY" && (
                <div className="lobby-container">
                    <div className="lobby-card">
                        <h2 className="lobby-title">Players Connected</h2>
                        <ul className="lobby-player-list">
                            {Object.values(players).map(p => (
                                <li key={p.userId} className="lobby-player-item">
                                    <span className="lobby-player-name">{p.username}</span>
                                    {String(hostId) === String(p.userId) && <span className="lobby-host-badge">Host</span>}
                                </li>
                            ))}
                        </ul>

                        <div className="lobby-actions">
                            {user && hostId && String(user.id) === String(hostId) ? (
                                <button
                                    onClick={handleStartGame}
                                    disabled={Object.keys(players).length < 2}
                                    className="lobby-start-btn"
                                >
                                    {Object.keys(players).length < 2 ? "Waiting for players..." : "Start Battle"}
                                </button>
                            ) : (
                                <div className="lobby-wait-msg">Waiting for host to start...</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {gameState === "PLAYING" && (
                <div className="kana-battle-playing-container">
                    {/* Reusing class names from KanaPracticePage.css for the Card */}
                    {/* Header for Timer and Score */}
                    <div className="battle-info-container">
                        <div className="battle-timer">
                            <span className="label">Time</span>
                            <span className="value">{timeLeft}s</span>
                        </div>
                        <div className="battle-score">
                            <span className="label">Score</span>
                            <span className="value">{score}</span>
                        </div>
                    </div>

                    {/* Main Card */}
                    <div className="kana-practice-card battle-card">
                        <div className="kana-card-content">

                            <div className="kana-display-area">
                                {/* No Romanji Hint in Battle Mode */}
                                <div className="kana-large">
                                    {definitions[currentIndex]?.kana}
                                </div>
                            </div>

                            <input
                                ref={inputRef}
                                type="text"
                                className="kana-input"
                                value={userInput}
                                onChange={handleInputChange}
                                autoFocus
                                placeholder="Type Romanji..."
                            />

                            <div className="kana-message-area">
                                {/* Using this space for simple feedback or empty */}
                            </div>
                        </div>
                    </div>


                    {/* Live Leaderboard */}
                    <div className="battle-leaderboard-container">
                        <h3 className="leaderboard-title">Live Ranking</h3>
                        <div className="leaderboard-list">
                            {Object.values(players)
                                .sort((a, b) => b.score - a.score)
                                .map((p, i) => (
                                    <div key={p.userId} className={`leaderboard-item ${i === 0 ? 'top-rank' : ''}`}>
                                        <div className="rank-info">
                                            <span className={`rank-number ${i === 0 ? 'gold' : ''}`}>{i + 1}</span>
                                            <span className="player-name">{p.username}</span>
                                        </div>
                                        <span className="player-score">{p.score}</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            )}

            {gameState === "FINISHED" && (
                <div className="game-over-container">
                    <div className="game-over-card">
                        <h2 className="game-over-title">Game Over!</h2>
                        <div className="results-list">
                            {Object.values(players)
                                .sort((a, b) => b.score - a.score)
                                .map((p, i) => (
                                    <div key={p.userId} className={`result-item ${i === 0 ? 'winner' : ''}`}>
                                        <div className="result-rank">#{i + 1}</div>
                                        <div className="result-username">{p.username}</div>
                                        <div className="result-score">{p.score}</div>
                                    </div>
                                ))}
                        </div>
                        <button
                            onClick={() => navigate("/kana-battle")}
                            className="game-over-btn"
                        >
                            Back to Lobby
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default KanaBattlePage;
