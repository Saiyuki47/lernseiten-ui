// Zufällige Permutation von [0..n-1] (Fisher-Yates). Startet möglichst nicht in
// der Originalreihenfolge, damit jede Runde sichtbar gemischt ist.
export function shuffleIndices(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  if (n > 1 && !arr.some((v, i) => v !== i)) {
    ;[arr[0], arr[1]] = [arr[1], arr[0]]
  }
  return arr
}
