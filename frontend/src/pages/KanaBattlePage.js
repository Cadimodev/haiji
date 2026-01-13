import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { charGroups, getRandomIndex } from "../utils/kanaData";
import "../styles/KanaBattleLandingPage.css"; // Reuse for now

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

    // Game Logic State (Similar to Practice)
    const [definitions, setDefinitions] = useState([]); // Array of {kana, romanji}
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userInput, setUserInput] = useState("");
    const [score, setScore] = useState(0);

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
            submitScore(newScore);
            setCurrentIndex(getRandomIndex(currentIndex, definitions.length));
        }
    };

    if (loadingUser) return <div>Loading...</div>;
    if (gameState === "ERROR") return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="kana-battle-page">
            <h1 className="text-center text-3xl font-bold py-4 text-white">Room: {roomCode}</h1>

            {gameState === "CONNECTING" && <div className="text-white text-center">Connecting...</div>}

            {gameState === "LOBBY" && (
                <div className="max-w-md mx-auto bg-gray-800 p-8 rounded-lg shadow-lg">
                    <h2 className="text-xl text-white mb-4">Players Connected:</h2>
                    <ul className="text-white mb-8">
                        {Object.values(players).map(p => (
                            <li key={p.userId} className="mb-2">
                                <span className="font-bold">{p.username}</span>
                                {hostId === p.userId && <span className="ml-2 text-yellow-400 text-sm">(Host)</span>}
                            </li>
                        ))}
                    </ul>

                    {user && hostId && user.id === hostId && (
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
                    {!(user && hostId && user.id === hostId) && (
                        <div className="text-gray-400 text-center italic">Waiting for host to start...</div>
                    )}
                </div>
            )}

            {gameState === "PLAYING" && (
                <div className="flex flex-col items-center">
                    <div className="text-6xl font-bold text-white mb-4">{timeLeft}s</div>
                    <div className="text-2xl text-pink-400 mb-8">Score: {score}</div>

                    <div className="bg-white p-12 rounded-xl shadow-2xl mb-8 flex flex-col items-center">
                        <div className="text-9xl mb-8">
                            {definitions[currentIndex]?.kana}
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            value={userInput}
                            onChange={handleInputChange}
                            autoFocus
                            className="text-4xl border-2 border-gray-300 rounded p-4 text-center w-64 focus:border-pink-500 outline-none"
                        />
                    </div>

                    {/* Live Leaderboard */}
                    <div className="w-64 bg-gray-900 bg-opacity-80 p-4 rounded text-white">
                        <h3 className="font-bold border-b border-gray-600 pb-2 mb-2">Live Ranking</h3>
                        {Object.values(players)
                            .sort((a, b) => b.score - a.score)
                            .map((p, i) => (
                                <div key={p.userId} className="flex justify-between">
                                    <span>{i + 1}. {p.username}</span>
                                    <span>{p.score}</span>
                                </div>
                            ))}
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
