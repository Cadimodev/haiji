export function getRandomIndex(current, max) {
    if (max === 0) return 0;
    let next = Math.floor(Math.random() * max);
    while (next === current && max > 1) {
        next = Math.floor(Math.random() * max);
    }
    return next;
}
