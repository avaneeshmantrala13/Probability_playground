import { Hand } from "pokersolver";
import type { Card } from "./types";

/**
 * Thin wrapper over `pokersolver`. We delegate all 5-of-7 hand evaluation and
 * tie-breaking to pokersolver because it is well-tested and handles every
 * showdown edge case (kickers, wheels, ties) correctly.
 */

export interface SolvedHand {
  seat: number;
  hand: Hand;
}

/** Solve a seat's best 5-card hand from its hole cards + the board. */
export function solveSeat(seat: number, holeCards: Card[], board: Card[]): SolvedHand {
  return { seat, hand: Hand.solve([...holeCards, ...board]) };
}

/**
 * Given the contenders (seat -> 7 available cards), return the seat indices of
 * the winner(s). Ties return multiple seats. `descr` is the winning hand's
 * human-readable description (e.g. "Full House, A's over K's").
 */
export function findWinners(
  contenders: { seat: number; holeCards: Card[] }[],
  board: Card[],
): { winners: number[]; descr: string } {
  if (contenders.length === 0) return { winners: [], descr: "" };

  const solved = contenders.map((c) => solveSeat(c.seat, c.holeCards, board));
  const hands = solved.map((s) => s.hand);
  const winningHands = Hand.winners(hands);

  const winners: number[] = [];
  for (const s of solved) {
    if (winningHands.includes(s.hand)) winners.push(s.seat);
  }
  const descr = winningHands[0]?.descr ?? "";
  return { winners, descr };
}

/** Describe a single 7-card holding (for the human's hand label). */
export function describeHand(holeCards: Card[], board: Card[]): string {
  if (holeCards.length + board.length < 5) return "";
  return Hand.solve([...holeCards, ...board]).descr;
}
