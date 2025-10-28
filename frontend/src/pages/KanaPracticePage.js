import React, {
    useState,
    useRef,
    useMemo,
    useEffect,
    useCallback,
} from "react";
import { Link } from "react-router-dom";
import '../styles/KanaPracticePage.css';

const charGroups = {
    hsingle: [
        { kana: "あ", romanji: "a" },
        { kana: "い", romanji: "i" },
        { kana: "う", romanji: "u" },
        { kana: "え", romanji: "e" },
        { kana: "お", romanji: "o" },
    ],
    hk: [
        { kana: "か", romanji: "ka" },
        { kana: "き", romanji: "ki" },
        { kana: "く", romanji: "ku" },
        { kana: "け", romanji: "ke" },
        { kana: "こ", romanji: "ko" },
    ],
    hs: [
        { kana: "さ", romanji: "sa" },
        { kana: "し", romanji: "shi" },
        { kana: "す", romanji: "su" },
        { kana: "せ", romanji: "se" },
        { kana: "そ", romanji: "so" },
    ],
    ht: [
        { kana: "た", romanji: "ta" },
        { kana: "ち", romanji: "chi" },
        { kana: "つ", romanji: "tsu" },
        { kana: "て", romanji: "te" },
        { kana: "と", romanji: "to" },
    ],
    hn: [
        { kana: "な", romanji: "na" },
        { kana: "に", romanji: "ni" },
        { kana: "ぬ", romanji: "nu" },
        { kana: "ね", romanji: "ne" },
        { kana: "の", romanji: "no" },
    ],
    hh: [
        { kana: "は", romanji: "ha" },
        { kana: "ひ", romanji: "hi" },
        { kana: "ふ", romanji: "fu" },
        { kana: "へ", romanji: "he" },
        { kana: "ほ", romanji: "ho" },
    ],
    hm: [
        { kana: "は", romanji: "ma" },
        { kana: "み", romanji: "mi" },
        { kana: "む", romanji: "mu" },
        { kana: "め", romanji: "me" },
        { kana: "も", romanji: "mo" },
    ],
    hy: [
        { kana: "や", romanji: "ya" },
        { kana: "ゆ", romanji: "yu" },
        { kana: "よ", romanji: "yo" },
    ],
    hr: [
        { kana: "ら", romanji: "ra" },
        { kana: "り", romanji: "ri" },
        { kana: "る", romanji: "ru" },
        { kana: "れ", romanji: "re" },
        { kana: "ろ", romanji: "ro" },
    ],
    hw: [
        { kana: "わ", romanji: "wa" },
        { kana: "を", romanji: "o" },
    ],
    hn1: [
        { kana: "ん", romanji: "n" },
    ],
    hg: [
        { kana: "が", romanji: "ga" },
        { kana: "ぎ", romanji: "gi" },
        { kana: "ぐ", romanji: "gu" },
        { kana: "げ", romanji: "ge" },
        { kana: "ご", romanji: "go" },
    ],
    hz: [
        { kana: "ざ", romanji: "za" },
        { kana: "じ", romanji: "ji" },
        { kana: "ず", romanji: "zu" },
        { kana: "ぜ", romanji: "ze" },
        { kana: "ぞ", romanji: "zo" },
    ],
    hd: [
        { kana: "だ", romanji: "da" },
        { kana: "ぢ", romanji: "ji" },
        { kana: "づ", romanji: "zu" },
        { kana: "で", romanji: "de" },
        { kana: "ど", romanji: "do" },
    ],
    hb: [
        { kana: "ば", romanji: "ba" },
        { kana: "び", romanji: "bi" },
        { kana: "ぶ", romanji: "bu" },
        { kana: "べ", romanji: "be" },
        { kana: "ぼ", romanji: "bo" },
    ],
    hp: [
        { kana: "ぱ", romanji: "pa" },
        { kana: "ぴ", romanji: "pi" },
        { kana: "ぷ", romanji: "pu" },
        { kana: "ぺ", romanji: "pe" },
        { kana: "ぽ", romanji: "po" },
    ],
};

function getRandomIndex(current, max) {
    if (max === 0) return 0;
    let next = Math.floor(Math.random() * max);
    while (next === current && max > 1) {
        next = Math.floor(Math.random() * max);
    }
    return next;
}

const MESSAGES = {
    instruction: "Hover over the kana to show its romanization and type the answer.",
    poolUpdated: "List updated. Start typing.",
    correct: "Correct!",
    correctAnswers: "Correct answers",
    incorrect: "Incorrect, try again.",
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
    const answerRef = useRef(null);
    const inputRef = useRef(null);

    // Generar pool con useMemo sin efectos secundarios
    const pool = useMemo(() => {
        const selectedGroups = Object.entries(checkedGroups)
            .filter(([_, checked]) => checked)
            .map(([id]) => id);

        if (selectedGroups.length === 0) {
            // No actualizar estado aquí para evitar renderizados infinitos
            return charGroups["hsingle"];
        }
        return selectedGroups.flatMap((id) => charGroups[id] || []);
    }, [checkedGroups]);

    // Controla el reset de índice, mensaje, input y count al cambiar pool
    useEffect(() => {
        if (pool.length === 0) {
            setMessage(MESSAGES.selectAtLeastOne);
            setCount(0);
            setUserInput("");
            return;
        }
        setCurrentIndex(Math.floor(Math.random() * pool.length));
        setMessage(MESSAGES.poolUpdated);
        setCount(0);
        setUserInput("");
    }, [pool]);

    // Forzar foco en input al montar
    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, []);

    const toggleCheckbox = useCallback(
        (id) => {
            setCheckedGroups((prev) => {
                const newChecked = { ...prev, [id]: !prev[id] };
                // Forzar at least one selected: si quedan todos false, selecciona hsingle y muestra mensaje
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

            if (pool.length === 0) return;

            const currentChar = pool[currentIndex];
            if (value.trim().toLowerCase() === currentChar.romanji) {
                setMessage(MESSAGES.correct);
                setCount((c) => c + 1);
                setUserInput("");
                setCurrentIndex((prev) => getRandomIndex(prev, pool.length));
            } else if (value.length >= currentChar.romanji.length) {
                setMessage(MESSAGES.incorrect);
            } else {
                setMessage("");
            }
        },
        [pool, currentIndex]
    );

    return (
        <div className="kana-practice-container">
            <div className="kana-main-box">
                <div
                    className="kana-romanji-hover"
                    style={{
                        visibility: showRomanji ? "visible" : "hidden"
                    }}
                >
                    {pool.length > 0 ? pool[currentIndex].romanji : ""}
                </div>
                <span
                    className="kana-large"
                    onMouseEnter={() => setShowRomanji(true)}
                    onMouseLeave={() => setShowRomanji(false)}
                >
                    {pool.length > 0 ? pool[currentIndex].kana : ""}
                </span>
                <input
                    type="text"
                    className="kana-input"
                    ref={inputRef}
                    autoFocus
                    value={userInput}
                    onChange={handleInputChange}
                />
                <div className="kana-message">
                    {message}
                </div>
                <div className="kana-count">
                    {MESSAGES.correctAnswers}: {count}
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
