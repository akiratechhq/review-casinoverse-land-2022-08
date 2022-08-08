function getShuffledUniqueNumbersByRange(range, amount) {
    const numbers = Array(range).fill().map((num, index) => index + 1);
    numbers.sort(() => Math.random() - 0.5);

    return numbers.slice(0, amount);
}

module.exports = {
    getShuffledUniqueNumbersByRange,
};