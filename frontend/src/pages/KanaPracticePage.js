import React, {
    useState,
    useRef,
    useMemo,
    useEffect,
    useCallback,
} from "react";
import '../styles/KanaPracticePage.css';
import { charGroups, getRandomIndex } from "../utils/kanaData";

const MESSAGES = {
    instruction: "Hover over the kana to show its romanization and type the answer.",
    poolUpdated: "List updated. Start typing.",
    correct: "Correct!",
    correctAnswers: "Correct answers",
    incorrect: "Incorrect. Correct answer:",
    selectAtLeastOne: "Select at least one group to practice.",
};

function KanaPracticePage() {

    const [checkedGroups, setCheckedGroups] = useState({
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

    const [currentIndex, setCurrentIndex] = useState(0);
    const [userInput, setUserInput] = useState("");
    const [message, setMessage] = useState(MESSAGES.instruction);
    const [count, setCount] = useState(0);
    const [showRomanji, setShowRomanji] = useState(false);
    const inputRef = useRef(null);

    const [incorrectCount, setIncorrectCount] = useState(0);

    const pool = useMemo(() => {
        const selectedGroups = Object.entries(checkedGroups)
            .filter(([_, checked]) => checked)
            .map(([id]) => id);

        if (selectedGroups.length === 0) {
            return charGroups["hsingle"];
        }
        return selectedGroups.flatMap((id) => charGroups[id] || []);
    }, [checkedGroups]);

    useEffect(() => {
        if (pool.length === 0) {
            setMessage(MESSAGES.selectAtLeastOne);
            setCount(0);
            setIncorrectCount(0);
            setUserInput("");
            return;
        }

        setMessage(MESSAGES.poolUpdated);
        setCount(0);
        setIncorrectCount(0);
        setUserInput("");
    }, [pool]);

    const safeIndex =
        pool.length === 0
            ? -1
            : Math.min(currentIndex, pool.length - 1);

    const currentChar = safeIndex === -1 ? null : pool[safeIndex];

    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, []);

    const toggleCheckbox = useCallback(
        (id) => {
            setCheckedGroups((prev) => {
                const newChecked = { ...prev, [id]: !prev[id] };
                if (!Object.values(newChecked).some((v) => v)) {
                    newChecked.hsingle = true;
                    setMessage(MESSAGES.poolUpdated);
                }
                return newChecked;
            });
        },
        []
    );

    const handleInputChange = useCallback(
        (e) => {
            const value = e.target.value;
            setUserInput(value);

            if (!currentChar) {
                return;
            }

            const normalized = value.trim().toLowerCase();

            if (normalized === currentChar.romanji) {
                // Correct answer
                setMessage(MESSAGES.correct);
                setCount((c) => c + 1);
                setUserInput("");
                setShowRomanji(false);
                setCurrentIndex((prev) => getRandomIndex(prev, pool.length));
            } else if (normalized.length >= currentChar.romanji.length) {
                // Incorrect answer (full length)
                setMessage(`${MESSAGES.incorrect} ${currentChar.romanji}`);
                setIncorrectCount((c) => c + 1);
                setShowRomanji(true);
            } else {
                setMessage("");
            }
        },
        [currentChar, pool.length]
    );

    return (
        <div className="kana-practice-container">
            <div className="kana-practice-card">
                <div className="kana-card-content">
                    <div className="kana-display-area">
                        <div
                            className={`kana-romanji-hint ${showRomanji ? "visible" : ""}`}
                        >
                            {currentChar ? currentChar.romanji : ""}
                        </div>
                        <div
                            className="kana-large"
                            onMouseEnter={() => setShowRomanji(true)}
                            onMouseLeave={() => setShowRomanji(false)}
                        >
                            {currentChar ? currentChar.kana : "?"}
                        </div>
                    </div>

                    <input
                        type="text"
                        className="kana-input"
                        ref={inputRef}
                        autoFocus
                        value={userInput}
                        onChange={handleInputChange}
                        placeholder="Type Romanji..."
                    />

                    <div className="kana-message-area">
                        {message}
                    </div>

                    <div className="kana-stats-bar">
                        <div className="stat-item correct">
                            <span className="stat-label">Correct:</span>
                            <span className="stat-value">{count}</span>
                        </div>
                        <div className="stat-divider">|</div>
                        <div className="stat-item incorrect">
                            <span className="stat-label">Incorrect:</span>
                            <span className="stat-value">{incorrectCount}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="kana-table-container">
                <h3 className="kana-table-title">Hiragana</h3>
                <table className="tableKana">
                    <thead>
                        <tr>
                            {Object.keys(charGroups)
                                .filter(id => id.startsWith("h"))
                                .map(id => (
                                    <th key={id}>
                                        <input
                                            type="checkbox"
                                            className="kanacheck"
                                            id={id}
                                            checked={checkedGroups[id] || false}
                                            onChange={() => toggleCheckbox(id)}
                                        />
                                    </th>
                                ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: 5 }).map((_, rowIndex) => (
                            <tr key={rowIndex}>
                                {Object.keys(charGroups)
                                    .filter(id => id.startsWith("h"))
                                    .map(id => {
                                        const char = charGroups[id][rowIndex];
                                        return (
                                            <td key={id}>
                                                {char ? (
                                                    <>
                                                        <span className="kana">{char.kana}</span>
                                                        <br />
                                                        <span className="romaji">{char.romanji}</span>
                                                    </>
                                                ) : null}
                                            </td>
                                        );
                                    })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div >
    );
}

export default KanaPracticePage;
