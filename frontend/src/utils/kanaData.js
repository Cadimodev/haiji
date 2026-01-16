// --- INTERNAL DATA SOURCES (SINGLE SOURCE OF TRUTH) ---

const BASIC_DATA = {
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
        { kana: "ま", romanji: "ma" },
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

const COMBINATIONS_DATA = {
    hkya: [
        { kana: "きゃ", romanji: "kya" },
        { kana: "きゅ", romanji: "kyu" },
        { kana: "きょ", romanji: "kyo" },
    ],
    hsha: [
        { kana: "しゃ", romanji: "sha" },
        { kana: "しゅ", romanji: "shu" },
        { kana: "しょ", romanji: "sho" },
    ],
    hcha: [
        { kana: "ちゃ", romanji: "cha" },
        { kana: "ちゅ", romanji: "chu" },
        { kana: "ちょ", romanji: "cho" },
    ],
    hnya: [
        { kana: "にゃ", romanji: "nya" },
        { kana: "にゅ", romanji: "nyu" },
        { kana: "にょ", romanji: "nyo" },
    ],
    hhya: [
        { kana: "ひゃ", romanji: "hya" },
        { kana: "ひゅ", romanji: "hyu" },
        { kana: "ひょ", romanji: "hyo" },
    ],
    hmya: [
        { kana: "みゃ", romanji: "mya" },
        { kana: "みゅ", romanji: "myu" },
        { kana: "みょ", romanji: "myo" },
    ],
    hrya: [
        { kana: "りゃ", romanji: "rya" },
        { kana: "りゅ", romanji: "ryu" },
        { kana: "りょ", romanji: "ryo" },
    ],
    hgya: [
        { kana: "ぎゃ", romanji: "gya" },
        { kana: "ぎゅ", romanji: "gyu" },
        { kana: "ぎょ", romanji: "gyo" },
    ],
    hja: [
        { kana: "じゃ", romanji: "ja" },
        { kana: "じゅ", romanji: "ju" },
        { kana: "じょ", romanji: "jo" },
    ],
    hbya: [
        { kana: "びゃ", romanji: "bya" },
        { kana: "びゅ", romanji: "byu" },
        { kana: "びょ", romanji: "byo" },
    ],
    hpya: [
        { kana: "ぴゃ", romanji: "pya" },
        { kana: "ぴゅ", romanji: "pyu" },
        { kana: "ぴょ", romanji: "pyo" },
    ],
};

const BASIC_LABELS_MAP = {
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

const COMBINATIONS_LABELS_MAP = {
    hkya: "kya-row",
    hsha: "sha-row",
    hcha: "cha-row",
    hnya: "nya-row",
    hhya: "hya-row",
    hmya: "mya-row",
    hrya: "rya-row",
    hgya: "gya-row",
    hja: "ja-row",
    hbya: "bya-row",
    hpya: "pya-row",
};

// --- EXPORTS (DERIVED) ---

// 1. Full data object (merged)
export const hiraganaCharGroups = {
    ...BASIC_DATA,
    ...COMBINATIONS_DATA
};

// 2. Full labels object (merged)
export const GROUP_LABELS = {
    ...BASIC_LABELS_MAP,
    ...COMBINATIONS_LABELS_MAP
};

// 3. Group Lists (Derived from keys)
export const BASIC_HIRAGANA_GROUPS = Object.keys(BASIC_DATA);
export const COMBINATION_HIRAGANA_GROUPS = Object.keys(COMBINATIONS_DATA);

// 4. All Group IDs (Concatenated)
export const GROUP_IDS = [
    ...BASIC_HIRAGANA_GROUPS,
    ...COMBINATION_HIRAGANA_GROUPS
];

