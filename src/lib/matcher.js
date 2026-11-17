const stopWords = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'was', 'are', 'has', 'have', 'lost', 'found', 'item', 'near', 'at', 'on', 'in', 'of', 'to', 'a', 'an', 'into', 'after', 'before', 'between', 'inside', 'outside', 'student', 'campus', 'college', 'block', 'library', 'hall', 'lobby'
]);

export function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !stopWords.has(word) && word.length > 1)
    .join(' ');
}

export function calculateSimilarity(a, b) {
  const left = normalizeText(`${a.item} ${a.description} ${a.location}`);
  const right = normalizeText(`${b.item} ${b.description} ${b.location}`);

  const leftWords = new Set(left.split(' '));
  const rightWords = new Set(right.split(' '));
  const union = new Set([...leftWords, ...rightWords]);

  let matches = 0;
  for (const word of leftWords) {
    if (rightWords.has(word)) matches += 1;
  }

  const score = union.size ? matches / union.size : 0;

  const exactBoost = a.item.toLowerCase() === b.item.toLowerCase() ? 0.28 : 0;
  const locationBoost = a.location.toLowerCase() === b.location.toLowerCase() ? 0.12 : 0;

  return Math.min(1, score + exactBoost + locationBoost);
}
