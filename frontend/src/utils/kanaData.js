// --- INTERNAL DATA SOURCES (SINGLE SOURCE OF TRUTH) ---

export const KANA_GROUPS = {
    // --- BASIC HIRAGANA ---
    hsingle: {
        id: "hsingle",
        label: "あ-row",
        category: "hiragana",
        section: "basic",
        chars: [
            { kana: "あ", romanji: "a" },
            { kana: "い", romanji: "i" },
            { kana: "う", romanji: "u" },
            { kana: "え", romanji: "e" },
            { kana: "お", romanji: "o" },
        ]
    },
    hk: {
        id: "hk",
        label: "か-row",
        category: "hiragana",
        section: "basic",
        chars: [
            { kana: "か", romanji: "ka" },
            { kana: "き", romanji: "ki" },
            { kana: "く", romanji: "ku" },
            { kana: "け", romanji: "ke" },
            { kana: "こ", romanji: "ko" },
        ]
    },
    hs: {
        id: "hs",
        label: "さ-row",
        category: "hiragana",
        section: "basic",
        chars: [
            { kana: "さ", romanji: "sa" },
            { kana: "し", romanji: "shi" },
            { kana: "す", romanji: "su" },
            { kana: "せ", romanji: "se" },
            { kana: "そ", romanji: "so" },
        ]
    },
    ht: {
        id: "ht",
        label: "た-row",
        category: "hiragana",
        section: "basic",
        chars: [
            { kana: "た", romanji: "ta" },
            { kana: "ち", romanji: "chi" },
            { kana: "つ", romanji: "tsu" },
            { kana: "て", romanji: "te" },
            { kana: "と", romanji: "to" },
        ]
    },
    hn: {
        id: "hn",
        label: "な-row",
        category: "hiragana",
        section: "basic",
        chars: [
            { kana: "な", romanji: "na" },
            { kana: "に", romanji: "ni" },
            { kana: "ぬ", romanji: "nu" },
            { kana: "ね", romanji: "ne" },
            { kana: "の", romanji: "no" },
        ]
    },
    hh: {
        id: "hh",
        label: "は-row",
        category: "hiragana",
        section: "basic",
        chars: [
            { kana: "は", romanji: "ha" },
            { kana: "ひ", romanji: "hi" },
            { kana: "ふ", romanji: "fu" },
            { kana: "へ", romanji: "he" },
            { kana: "ほ", romanji: "ho" },
        ]
    },
    hm: {
        id: "hm",
        label: "ま-row",
        category: "hiragana",
        section: "basic",
        chars: [
            { kana: "ま", romanji: "ma" },
            { kana: "み", romanji: "mi" },
            { kana: "む", romanji: "mu" },
            { kana: "め", romanji: "me" },
            { kana: "も", romanji: "mo" },
        ]
    },
    hy: {
        id: "hy",
        label: "や-row",
        category: "hiragana",
        section: "basic",
        chars: [
            { kana: "や", romanji: "ya" },
            { kana: "ゆ", romanji: "yu" },
            { kana: "よ", romanji: "yo" },
        ]
    },
    hr: {
        id: "hr",
        label: "ら-row",
        category: "hiragana",
        section: "basic",
        chars: [
            { kana: "ら", romanji: "ra" },
            { kana: "り", romanji: "ri" },
            { kana: "る", romanji: "ru" },
            { kana: "れ", romanji: "re" },
            { kana: "ろ", romanji: "ro" },
        ]
    },
    hw: {
        id: "hw",
        label: "わ-row",
        category: "hiragana",
        section: "basic",
        chars: [
            { kana: "わ", romanji: "wa" },
            { kana: "を", romanji: "o" },
        ]
    },
    hn1: {
        id: "hn1",
        label: "ん",
        category: "hiragana",
        section: "basic",
        chars: [
            { kana: "ん", romanji: "n" },
        ]
    },
    hg: {
        id: "hg",
        label: "が-row",
        category: "hiragana",
        section: "basic",
        chars: [
            { kana: "が", romanji: "ga" },
            { kana: "ぎ", romanji: "gi" },
            { kana: "ぐ", romanji: "gu" },
            { kana: "げ", romanji: "ge" },
            { kana: "ご", romanji: "go" },
        ]
    },
    hz: {
        id: "hz",
        label: "ざ-row",
        category: "hiragana",
        section: "basic",
        chars: [
            { kana: "ざ", romanji: "za" },
            { kana: "じ", romanji: "ji" },
            { kana: "ず", romanji: "zu" },
            { kana: "ぜ", romanji: "ze" },
            { kana: "ぞ", romanji: "zo" },
        ]
    },
    hd: {
        id: "hd",
        label: "だ-row",
        category: "hiragana",
        section: "basic",
        chars: [
            { kana: "だ", romanji: "da" },
            { kana: "ぢ", romanji: "ji" },
            { kana: "づ", romanji: "zu" },
            { kana: "で", romanji: "de" },
            { kana: "ど", romanji: "do" },
        ]
    },
    hb: {
        id: "hb",
        label: "ば-row",
        category: "hiragana",
        section: "basic",
        chars: [
            { kana: "ば", romanji: "ba" },
            { kana: "び", romanji: "bi" },
            { kana: "ぶ", romanji: "bu" },
            { kana: "べ", romanji: "be" },
            { kana: "ぼ", romanji: "bo" },
        ]
    },
    hp: {
        id: "hp",
        label: "ぱ-row",
        category: "hiragana",
        section: "basic",
        chars: [
            { kana: "ぱ", romanji: "pa" },
            { kana: "ぴ", romanji: "pi" },
            { kana: "ぷ", romanji: "pu" },
            { kana: "ぺ", romanji: "pe" },
            { kana: "ぽ", romanji: "po" },
        ]
    },

    // --- BASIC KATAKANA ---
    ksingle: {
        id: "ksingle",
        label: "ア-row",
        category: "katakana",
        section: "basic",
        chars: [
            { kana: "ア", romanji: "a" },
            { kana: "イ", romanji: "i" },
            { kana: "ウ", romanji: "u" },
            { kana: "エ", romanji: "e" },
            { kana: "オ", romanji: "o" },
        ]
    },
    kk: {
        id: "kk",
        label: "カ-row",
        category: "katakana",
        section: "basic",
        chars: [
            { kana: "カ", romanji: "ka" },
            { kana: "キ", romanji: "ki" },
            { kana: "ク", romanji: "ku" },
            { kana: "ケ", romanji: "ke" },
            { kana: "コ", romanji: "ko" },
        ]
    },
    ks: {
        id: "ks",
        label: "サ-row",
        category: "katakana",
        section: "basic",
        chars: [
            { kana: "サ", romanji: "sa" },
            { kana: "シ", romanji: "shi" },
            { kana: "ス", romanji: "su" },
            { kana: "セ", romanji: "se" },
            { kana: "ソ", romanji: "so" },
        ]
    },
    kt: {
        id: "kt",
        label: "タ-row",
        category: "katakana",
        section: "basic",
        chars: [
            { kana: "タ", romanji: "ta" },
            { kana: "チ", romanji: "chi" },
            { kana: "ツ", romanji: "tsu" },
            { kana: "テ", romanji: "te" },
            { kana: "ト", romanji: "to" },
        ]
    },
    kn: {
        id: "kn",
        label: "ナ-row",
        category: "katakana",
        section: "basic",
        chars: [
            { kana: "ナ", romanji: "na" },
            { kana: "ニ", romanji: "ni" },
            { kana: "ヌ", romanji: "nu" },
            { kana: "ネ", romanji: "ne" },
            { kana: "ノ", romanji: "no" },
        ]
    },
    kh: {
        id: "kh",
        label: "ハ-row",
        category: "katakana",
        section: "basic",
        chars: [
            { kana: "ハ", romanji: "ha" },
            { kana: "ヒ", romanji: "hi" },
            { kana: "フ", romanji: "fu" },
            { kana: "ヘ", romanji: "he" },
            { kana: "ホ", romanji: "ho" },
        ]
    },
    km: {
        id: "km",
        label: "マ-row",
        category: "katakana",
        section: "basic",
        chars: [
            { kana: "マ", romanji: "ma" },
            { kana: "ミ", romanji: "mi" },
            { kana: "ム", romanji: "mu" },
            { kana: "メ", romanji: "me" },
            { kana: "モ", romanji: "mo" },
        ]
    },
    ky: {
        id: "ky",
        label: "ヤ-row",
        category: "katakana",
        section: "basic",
        chars: [
            { kana: "ヤ", romanji: "ya" },
            { kana: "ユ", romanji: "yu" },
            { kana: "ヨ", romanji: "yo" },
        ]
    },
    kr: {
        id: "kr",
        label: "ラ-row",
        category: "katakana",
        section: "basic",
        chars: [
            { kana: "ラ", romanji: "ra" },
            { kana: "リ", romanji: "ri" },
            { kana: "ル", romanji: "ru" },
            { kana: "レ", romanji: "re" },
            { kana: "ロ", romanji: "ro" },
        ]
    },
    kw: {
        id: "kw",
        label: "ワ-row",
        category: "katakana",
        section: "basic",
        chars: [
            { kana: "ワ", romanji: "wa" },
            { kana: "ヲ", romanji: "o" },
        ]
    },
    kn1: {
        id: "kn1",
        label: "ン",
        category: "katakana",
        section: "basic",
        chars: [
            { kana: "ン", romanji: "n" },
        ]
    },
    kg: {
        id: "kg",
        label: "ガ-row",
        category: "katakana",
        section: "basic",
        chars: [
            { kana: "ガ", romanji: "ga" },
            { kana: "ギ", romanji: "gi" },
            { kana: "グ", romanji: "gu" },
            { kana: "ゲ", romanji: "ge" },
            { kana: "ゴ", romanji: "go" },
        ]
    },
    kz: {
        id: "kz",
        label: "ザ-row",
        category: "katakana",
        section: "basic",
        chars: [
            { kana: "ザ", romanji: "za" },
            { kana: "ジ", romanji: "ji" },
            { kana: "ズ", romanji: "zu" },
            { kana: "ゼ", romanji: "ze" },
            { kana: "ゾ", romanji: "zo" },
        ]
    },
    kd: {
        id: "kd",
        label: "ダ-row",
        category: "katakana",
        section: "basic",
        chars: [
            { kana: "ダ", romanji: "da" },
            { kana: "ヂ", romanji: "ji" },
            { kana: "ヅ", romanji: "zu" },
            { kana: "デ", romanji: "de" },
            { kana: "ド", romanji: "do" },
        ]
    },
    kb: {
        id: "kb",
        label: "バ-row",
        category: "katakana",
        section: "basic",
        chars: [
            { kana: "バ", romanji: "ba" },
            { kana: "ビ", romanji: "bi" },
            { kana: "ブ", romanji: "bu" },
            { kana: "ベ", romanji: "be" },
            { kana: "ボ", romanji: "bo" },
        ]
    },
    kp: {
        id: "kp",
        label: "パ-row",
        category: "katakana",
        section: "basic",
        chars: [
            { kana: "パ", romanji: "pa" },
            { kana: "ピ", romanji: "pi" },
            { kana: "プ", romanji: "pu" },
            { kana: "ペ", romanji: "pe" },
            { kana: "ポ", romanji: "po" },
        ]
    },

    // --- HIRAGANA COMBINATIONS ---
    hkya: {
        id: "hkya",
        label: "kya-row",
        category: "hiragana",
        section: "combination",
        chars: [
            { kana: "きゃ", romanji: "kya" },
            { kana: "きゅ", romanji: "kyu" },
            { kana: "きょ", romanji: "kyo" },
        ]
    },
    hsha: {
        id: "hsha",
        label: "sha-row",
        category: "hiragana",
        section: "combination",
        chars: [
            { kana: "しゃ", romanji: "sha" },
            { kana: "しゅ", romanji: "shu" },
            { kana: "しょ", romanji: "sho" },
        ]
    },
    hcha: {
        id: "hcha",
        label: "cha-row",
        category: "hiragana",
        section: "combination",
        chars: [
            { kana: "ちゃ", romanji: "cha" },
            { kana: "ちゅ", romanji: "chu" },
            { kana: "ちょ", romanji: "cho" },
        ]
    },
    hnya: {
        id: "hnya",
        label: "nya-row",
        category: "hiragana",
        section: "combination",
        chars: [
            { kana: "にゃ", romanji: "nya" },
            { kana: "にゅ", romanji: "nyu" },
            { kana: "にょ", romanji: "nyo" },
        ]
    },
    hhya: {
        id: "hhya",
        label: "hya-row",
        category: "hiragana",
        section: "combination",
        chars: [
            { kana: "ひゃ", romanji: "hya" },
            { kana: "ひゅ", romanji: "hyu" },
            { kana: "ひょ", romanji: "hyo" },
        ]
    },
    hmya: {
        id: "hmya",
        label: "mya-row",
        category: "hiragana",
        section: "combination",
        chars: [
            { kana: "みゃ", romanji: "mya" },
            { kana: "みゅ", romanji: "myu" },
            { kana: "みょ", romanji: "myo" },
        ]
    },
    hrya: {
        id: "hrya",
        label: "rya-row",
        category: "hiragana",
        section: "combination",
        chars: [
            { kana: "りゃ", romanji: "rya" },
            { kana: "りゅ", romanji: "ryu" },
            { kana: "りょ", romanji: "ryo" },
        ]
    },
    hgya: {
        id: "hgya",
        label: "gya-row",
        category: "hiragana",
        section: "combination",
        chars: [
            { kana: "ぎゃ", romanji: "gya" },
            { kana: "ぎゅ", romanji: "gyu" },
            { kana: "ぎょ", romanji: "gyo" },
        ]
    },
    hja: {
        id: "hja",
        label: "ja-row",
        category: "hiragana",
        section: "combination",
        chars: [
            { kana: "じゃ", romanji: "ja" },
            { kana: "じゅ", romanji: "ju" },
            { kana: "じょ", romanji: "jo" },
        ]
    },
    hbya: {
        id: "hbya",
        label: "bya-row",
        category: "hiragana",
        section: "combination",
        chars: [
            { kana: "びゃ", romanji: "bya" },
            { kana: "びゅ", romanji: "byu" },
            { kana: "びょ", romanji: "byo" },
        ]
    },
    hpya: {
        id: "hpya",
        label: "pya-row",
        category: "hiragana",
        section: "combination",
        chars: [
            { kana: "ぴゃ", romanji: "pya" },
            { kana: "ぴゅ", romanji: "pyu" },
            { kana: "ぴょ", romanji: "pyo" },
        ]
    },

    // --- KATAKANA COMBINATIONS ---
    kkya: {
        id: "kkya",
        label: "kya-row",
        category: "katakana",
        section: "combination",
        chars: [
            { kana: "キャ", romanji: "kya" },
            { kana: "キュ", romanji: "kyu" },
            { kana: "キョ", romanji: "kyo" },
        ]
    },
    ksha: {
        id: "ksha",
        label: "sha-row",
        category: "katakana",
        section: "combination",
        chars: [
            { kana: "シャ", romanji: "sha" },
            { kana: "シュ", romanji: "shu" },
            { kana: "ショ", romanji: "sho" },
        ]
    },
    kcha: {
        id: "kcha",
        label: "cha-row",
        category: "katakana",
        section: "combination",
        chars: [
            { kana: "チャ", romanji: "cha" },
            { kana: "チュ", romanji: "chu" },
            { kana: "チョ", romanji: "cho" },
        ]
    },
    knya: {
        id: "knya",
        label: "nya-row",
        category: "katakana",
        section: "combination",
        chars: [
            { kana: "ニャ", romanji: "nya" },
            { kana: "ニュ", romanji: "nyu" },
            { kana: "ニョ", romanji: "nyo" },
        ]
    },
    khya: {
        id: "khya",
        label: "hya-row",
        category: "katakana",
        section: "combination",
        chars: [
            { kana: "ヒャ", romanji: "hya" },
            { kana: "ヒュ", romanji: "hyu" },
            { kana: "ヒョ", romanji: "hyo" },
        ]
    },
    kmya: {
        id: "kmya",
        label: "mya-row",
        category: "katakana",
        section: "combination",
        chars: [
            { kana: "ミャ", romanji: "mya" },
            { kana: "ミュ", romanji: "myu" },
            { kana: "ミョ", romanji: "myo" },
        ]
    },
    krya: {
        id: "krya",
        label: "rya-row",
        category: "katakana",
        section: "combination",
        chars: [
            { kana: "リャ", romanji: "rya" },
            { kana: "リュ", romanji: "ryu" },
            { kana: "リョ", romanji: "ryo" },
        ]
    },
    kgya: {
        id: "kgya",
        label: "gya-row",
        category: "katakana",
        section: "combination",
        chars: [
            { kana: "ギャ", romanji: "gya" },
            { kana: "ギュ", romanji: "gyu" },
            { kana: "ギョ", romanji: "gyo" },
        ]
    },
    kja: {
        id: "kja",
        label: "ja-row",
        category: "katakana",
        section: "combination",
        chars: [
            { kana: "ジャ", romanji: "ja" },
            { kana: "ジュ", romanji: "ju" },
            { kana: "ジョ", romanji: "jo" },
        ]
    },
    kbya: {
        id: "kbya",
        label: "bya-row",
        category: "katakana",
        section: "combination",
        chars: [
            { kana: "ビャ", romanji: "bya" },
            { kana: "ビュ", romanji: "byu" },
            { kana: "ビョ", romanji: "byo" },
        ]
    },
    kpya: {
        id: "kpya",
        label: "pya-row",
        category: "katakana",
        section: "combination",
        chars: [
            { kana: "ピャ", romanji: "pya" },
            { kana: "ピュ", romanji: "pyu" },
            { kana: "ピョ", romanji: "pyo" },
        ]
    },
};

// --- HELPER FUNCTIONS ---

export const getGroupsBy = (category, section) => {
    return Object.values(KANA_GROUPS)
        .filter(g => g.category === category && g.section === section)
        .map(g => g.id);
};

// --- BACKWARD COMPATIBILITY / DERIVED EXPORTS ---

// 1. Full data object (merged)
export const kanaCharGroups = Object.entries(KANA_GROUPS).reduce((acc, [key, group]) => {
    acc[key] = group.chars;
    return acc;
}, {});

// Alias for backward compatibility
export const hiraganaCharGroups = kanaCharGroups;

// 2. Full labels object (merged)
export const GROUP_LABELS = Object.entries(KANA_GROUPS).reduce((acc, [key, group]) => {
    acc[key] = group.label;
    return acc;
}, {});

// 3. Group Lists (Derived from keys)
// Kept for compatibility but consumers should prefer getGroupsBy()
export const BASIC_HIRAGANA_GROUPS = getGroupsBy("hiragana", "basic");
export const BASIC_KATAKANA_GROUPS = getGroupsBy("katakana", "basic");
export const COMBINATION_HIRAGANA_GROUPS = getGroupsBy("hiragana", "combination");
export const COMBINATION_KATAKANA_GROUPS = getGroupsBy("katakana", "combination");

// 4. All Group IDs
export const GROUP_IDS = Object.keys(KANA_GROUPS);
