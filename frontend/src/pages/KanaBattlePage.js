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
                <div className="max-w-md mx-auto bg-gray-800 p-8 rounded-lg shadow-lg">
                    <h2 className="text-xl text-white mb-4">Players Connected:</h2>
                    <ul className="text-white mb-8">
                        {Object.values(players).map(p => (
                            <li key={p.userId} className="mb-2">
                                <span className="font-bold">{p.username}</span>
                                {String(hostId) === String(p.userId) && <span className="ml-2 text-yellow-400 text-sm">(Host)</span>}
                            </li>
                        ))}
                    </ul>

                    {/* Debug Info */}
                    <div className="text-xs text-gray-500 mb-4">
                        <p>User ID: {user?.id} ({typeof user?.id})</p>
                        <p>Host ID: {hostId} ({typeof hostId})</p>
                        <p>Match: {String(user?.id) === String(hostId) ? "YES" : "NO"}</p>
                    </div>

                    {user && hostId && String(user.id) === String(hostId) && (
                        <button
                            onClick={handleStartGame}
                            disabled={Object.keys(players).length < 2}
                            className={`w-full font-bold py-2 px-4 rounded ${Object.keys(players).length < 2
                                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                                : 'bg-pink-500 hover:bg-pink-600 text-white'}`}
                        >
                            {Object.keys(players).length < 2 ? "Waiting for players..." : "Start Battle"}
                        </button>
                    )}
                    {!(user && hostId && String(user.id) === String(hostId)) && (
                        <div className="text-gray-400 text-center italic">Waiting for host to start...</div>
                    )}
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
                <div className="max-w-md mx-auto bg-gray-800 p-8 rounded-lg shadow-lg text-center">
                    <h2 className="text-3xl text-white mb-8">Game Over!</h2>
                    <div className="space-y-4">
                        {Object.values(players)
                            .sort((a, b) => b.score - a.score)
                            .map((p, i) => (
                                <div key={p.userId} className={`flex justify-between p-4 rounded ${i === 0 ? 'bg-yellow-600' : 'bg-gray-700'} text-white`}>
                                    <div className="flex items-center">
                                        <span className="text-xl font-bold mr-4">#{i + 1}</span>
                                        <span className="text-lg">{p.username}</span>
                                    </div>
                                    <span className="text-2xl font-bold">{p.score}</span>
                                </div>
                            ))}
                    </div>
                    <button
                        onClick={() => navigate("/kana-battle")}
                        className="mt-8 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded"
                    >
                        Back to Lobby
                    </button>
                </div>
            )}
        </div>
    );
}

export default KanaBattlePage;
