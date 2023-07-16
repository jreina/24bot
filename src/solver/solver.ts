import { Card } from "../game/deck";

/**
 * Copilot suggested this function to solve the 24 game.
 * It also suggested this comment.
 */
function solveHelper(
  numbers: number[],
  expr: string,
  results: Array<string>
): void {
  if (numbers.length === 1) {
    if (numbers[0] === 24) {
      results.push(expr);
    }
    return;
  }
  for (let i = 0; i < numbers.length; i++) {
    for (let j = 0; j < numbers.length; j++) {
      if (i !== j) {
        const a = numbers[i];
        const b = numbers[j];
        const remaining = numbers.filter((_, k) => k !== i && k !== j);
        solveHelper([...remaining, a + b], `(${expr} ${a}+${b})`, results);
        solveHelper([...remaining, a - b], `(${expr} ${a}-${b})`, results);
        solveHelper([...remaining, b - a], `(${expr} ${b}-${a})`, results);
        solveHelper([...remaining, a * b], `(${expr} ${a}*${b})`, results);
        if (b !== 0) {
          solveHelper([...remaining, a / b], `(${expr} ${a}/${b})`, results);
        }
        if (a !== 0) {
          solveHelper([...remaining, b / a], `(${expr} ${b}/${a})`, results);
        }
      }
    }
  }
}

export function solve(cards: Card[]): string[] {
  const results: string[] = [];

  solveHelper(
    cards.map((card) => card.number),
    "",
    results
  );
  return results;
}

/**
 * Returns true if the given cards have a solution.
 */
export function hasSolution(cards: Card[]): boolean {
  return solve(cards).length > 0;
}
