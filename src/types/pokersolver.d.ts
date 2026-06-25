declare module "pokersolver" {
  /**
   * A solved poker hand. Card strings use rank + suit, where rank is one of
   * "A K Q J T 9 8 7 6 5 4 3 2" and suit is one of "s h d c" (e.g. "Ad", "Th").
   */
  export class Hand {
    /** Numeric strength rank (higher is better). */
    rank: number;
    /** Category name, e.g. "Pair", "Flush", "Full House". */
    name: string;
    /** Human-readable description, e.g. "Full House, A's over K's". */
    descr: string;
    /** The cards composing the best 5-card hand. */
    cards: unknown[];

    /** Solve the best 5-card hand from 5–7 card strings. */
    static solve(cards: string[], game?: string, canDisqualify?: boolean): Hand;

    /** Return the winning hand(s) (ties yield multiple). */
    static winners(hands: Hand[]): Hand[];
  }
}
