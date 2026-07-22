// Levenshtein distance — counts insertions, deletions, substitutions
function levenshtein(a: string, b: string): number {
  const m = a.length,
    n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// Returns true if input is close enough to target
// Tolerance: 1 typo per 5 chars, min 1 allowed for words ≥4 chars
export function fuzzyMatch(input: string, target: string): boolean {
  const a = input.trim().toLowerCase();
  const b = target.trim().toLowerCase();
  if (a === b) return true;
  const maxDist = b.length >= 4 ? Math.floor(b.length / 5) + 1 : 0;
  return levenshtein(a, b) <= maxDist;
}
