
// Kana data extracted from KanaPracticePage.js with additional utilities

export const charGroups = {
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

export const GROUP_IDS = Object.keys(charGroups);

export const GROUP_LABELS = {
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

export function getRandomIndex(current, max) {
    if (max === 0) return 0;
    let next = Math.floor(Math.random() * max);
    while (next === current && max > 1) {
        next = Math.floor(Math.random() * max);
    }
    return next;
}
