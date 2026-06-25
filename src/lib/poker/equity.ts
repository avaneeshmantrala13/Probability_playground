import { Hand } from "pokersolver";
import type { Card } from "./types";
import { FULL_DECK } from "./deck";

/**
 * Monte-Carlo equity estimator.
 *
 * Given the hero's 2 hole cards, the current board (0/3/4/5 cards) and the
 * number of live opponents, we repeatedly:
 *   1. take the remaining deck (52 minus known/dead cards),
 *   2. randomly deal each opponent 2 cards + complete the board to 5,
 *   3. evaluate every hand with pokersolver and tally hero win/tie/loss.
 *
 * The result is the hero's EQUITY = P(win) + P(tie split share). Iterations are
 * capped (≈600–1500) so a decision stays well under a frame budget.
 *
 * NOTE: this simulation uses `Math.random` (not crypto) ON PURPOSE — it is a
 * statistical estimator, not the real game deck, and Math.random is much faster
 * for the hundreds of samples we draw. The REAL deck is shuffled with the
 * crypto Fisher–Yates in `shuffle.ts`.
 */

export interface EquityResult {
  /** Win + tie-split share in [0, 1]. */
  equity: number;
  win: number;
  tie: number;
  lose: number;
  iterations: number;
}

/** Fisher–Yates partial draw: pick `count` distinct cards from `pool` (mutates a copy index window). */
function drawSample(pool: Card[], count: number, out: Card[]): void {
  // Partial Fisher–Yates over `pool`; we only need the first `count` slots.
  const n = pool.length;
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (n - i));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
    out[i] = pool[i];
  }
}

export function estimateEquity(
  hole: Card[],
  board: Card[],
  numOpponents: number,
  iterations = 800,
): EquityResult {
  if (hole.length !== 2) {
    return { equity: 0, win: 0, tie: 0, lose: 0, iterations: 0 };
  }
  if (numOpponents <= 0) {
    return { equity: 1, win: 1, tie: 0, lose: 0, iterations: 0 };
  }

  const known = new Set<Card>([...hole, ...board]);
  const pool: Card[] = FULL_DECK.filter((c) => !known.has(c));

  const boardNeeded = 5 - board.length;
  const drawCount = numOpponents * 2 + boardNeeded;

  let wins = 0;
  let ties = 0;
  let losses = 0;

  const drawn: Card[] = new Array(drawCount);

  for (let iter = 0; iter < iterations; iter++) {
    drawSample(pool, drawCount, drawn);

    const fullBoard =
      boardNeeded === 0 ? board : board.concat(drawn.slice(0, boardNeeded));

    const heroHand = Hand.solve([...hole, ...fullBoard]);

    let heroBeatsAll = true;
    let heroTiedBest = false;
    let cursor = boardNeeded;

    for (let o = 0; o < numOpponents; o++) {
      const oppCards = [drawn[cursor], drawn[cursor + 1]];
      cursor += 2;
      const oppHand = Hand.solve([...oppCards, ...fullBoard]);
      const winners = Hand.winners([heroHand, oppHand]);
      const heroWins = winners.includes(heroHand);
      const oppWins = winners.includes(oppHand);
      if (oppWins && !heroWins) {
        heroBeatsAll = false;
        heroTiedBest = false;
        break;
      }
      if (heroWins && oppWins) {
        heroTiedBest = true; // chop with at least this opponent
      }
    }

    if (!heroBeatsAll) {
      losses++;
    } else if (heroTiedBest) {
      ties++;
    } else {
      wins++;
    }
  }

  const total = iterations;
  // Tie contributes a partial share (~half vs one opponent on average); this is
  // a standard simplification that keeps equity well-calibrated for decisions.
  const equity = (wins + ties * 0.5) / total;
  return {
    equity,
    win: wins / total,
    tie: ties / total,
    lose: losses / total,
    iterations: total,
  };
}
