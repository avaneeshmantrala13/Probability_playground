import { TABLE_TIERS, tokenBalance } from "./tokens";
import type { CourseProgress } from "./progress";

/**
 * The Comeback Challenge: when a player busts their stack they can earn a
 * rebuy by answering a short set of *extra-hard*, hand-authored probability and
 * poker-math questions. The bank below is intentionally tough — exact equities,
 * combinatorics, conditional probability, expected value, and pot-odds calls.
 */
export interface ComebackQuestion {
  id: string;
  prompt: string;
  options: string[];
  /** Index into `options` of the correct answer. */
  correctIndex: number;
  explanation: string;
}

export const COMEBACK_QUESTIONS: ComebackQuestion[] = [
  {
    id: "cb-set-on-flop",
    prompt:
      "You're dealt a pocket pair. What is the probability you flop at least a set (three of a kind or better) on the flop?",
    options: ["4.2%", "7.5%", "11.8%", "19.0%"],
    correctIndex: 2,
    explanation:
      "P(no set) = C(48,3)/C(50,3) = (47·46)/(50·49) ≈ 0.882, so flopping a set is about 1 − 0.882 ≈ 11.8% (roughly 1 in 8.5).",
  },
  {
    id: "cb-flush-draw-river",
    prompt:
      "You flop a flush draw (9 outs). With both the turn and river to come, what is the probability you complete the flush by the river?",
    options: ["19.6%", "31.5%", "35.0%", "41.7%"],
    correctIndex: 2,
    explanation:
      "P(miss both) = (38/47)·(37/46) ≈ 0.650, so you complete it about 1 − 0.650 ≈ 35.0%.",
  },
  {
    id: "cb-pot-odds",
    prompt:
      "The pot is $100 and your opponent bets $50. To call profitably, what is the minimum pot equity (chance to win) you need?",
    options: ["20%", "25%", "33%", "50%"],
    correctIndex: 1,
    explanation:
      "You risk $50 to win the $150 already out there. Required equity = 50 / (150 + 50) = 50/200 = 25%.",
  },
  {
    id: "cb-aa-vs-kk",
    prompt:
      "Two players are all-in preflop with pocket Aces against pocket Kings. Approximately how often do the Aces win?",
    options: ["65%", "72%", "82%", "91%"],
    correctIndex: 2,
    explanation:
      "AA is roughly an 82-to-18 favorite over KK (about 81.9% to win, ~0.5% to tie) — the classic 'cooler' matchup.",
  },
  {
    id: "cb-combos",
    prompt:
      "Ignoring order, how many distinct two-card starting hands (specific card combinations) exist in a 52-card deck?",
    options: ["169", "1,326", "2,652", "2,652,000"],
    correctIndex: 1,
    explanation:
      "C(52,2) = (52·51)/2 = 1,326 combinations. (169 is the count of strategically distinct hand types; 2,652 counts ordered pairs.)",
  },
  {
    id: "cb-pocket-pair-dealt",
    prompt: "What is the probability your two hole cards are a pocket pair?",
    options: ["0.45%", "1.2%", "5.9%", "11.8%"],
    correctIndex: 2,
    explanation:
      "After your first card, 3 of the remaining 51 cards pair it: 3/51 ≈ 5.9% (≈ 1 in 17). Equivalently 13·C(4,2)/C(52,2) = 78/1326.",
  },
  {
    id: "cb-ev-bet",
    prompt:
      "A side bet pays you +$30 with probability 0.2 and costs you $10 with probability 0.8. What is its expected value?",
    options: ["−$4", "−$2", "+$2", "+$4"],
    correctIndex: 1,
    explanation: "EV = (0.2 × +30) + (0.8 × −10) = 6 − 8 = −$2, so the bet is unprofitable.",
  },
  {
    id: "cb-both-aces",
    prompt:
      "Off the top of a freshly shuffled deck, what is the probability the first two cards are both Aces?",
    options: ["0.45%", "0.90%", "1.2%", "5.9%"],
    correctIndex: 0,
    explanation: "(4/52)·(3/51) = 12/2652 = 1/221 ≈ 0.45%.",
  },
  {
    id: "cb-oesd-river",
    prompt:
      "You flop an open-ended straight draw (8 outs). With the turn and river to come, what is the probability you make the straight by the river?",
    options: ["8.5%", "17.0%", "31.5%", "44.0%"],
    correctIndex: 2,
    explanation:
      "P(miss both) = (39/47)·(38/46) ≈ 0.685, so you hit about 1 − 0.685 ≈ 31.5%.",
  },
  {
    id: "cb-one-card-equity",
    prompt:
      "You have a flush draw (9 outs) on the turn with only the river to come. What is your approximate equity?",
    options: ["9.0%", "19.6%", "35.0%", "38.0%"],
    correctIndex: 1,
    explanation:
      "With one card to come there are 46 unseen cards: 9/46 ≈ 19.6%. (The 'rule of 2' estimate 9×2 = 18% is close.)",
  },
  {
    id: "cb-bayes-cards",
    prompt:
      "Three cards: one red on both sides, one black on both sides, one red/black. You draw one at random and the face you see is red. What is the probability the other side is also red?",
    options: ["1/3", "1/2", "2/3", "3/4"],
    correctIndex: 2,
    explanation:
      "There are 3 equally likely red faces; 2 of them belong to the all-red card. So P(other side red | this side red) = 2/3, not 1/2.",
  },

  // ── Experimental vs. theoretical probability ───────────────────────────
  {
    id: "cb-exp-coin-200",
    prompt:
      "A coin is flipped 200 times and lands heads 116 times. What is the experimental probability of heads from this data?",
    options: ["0.50", "0.54", "0.58", "0.62"],
    correctIndex: 2,
    explanation:
      "Experimental probability = successes / trials = 116/200 = 0.58. (The theoretical value for a fair coin is 0.50; the gap is normal sampling variation.)",
  },
  {
    id: "cb-exp-spinner-50",
    prompt:
      "A spinner is spun 50 times and lands on blue 18 times. What is the experimental probability of landing on blue?",
    options: ["0.18", "0.32", "0.36", "0.40"],
    correctIndex: 2,
    explanation: "18/50 = 0.36 — that's the relative frequency observed in the data.",
  },
  {
    id: "cb-law-large-numbers",
    prompt:
      "As you flip a fair coin more and more times, what happens to the experimental probability of heads?",
    options: [
      "It stays locked at exactly 0.5 from the start",
      "It tends to approach the theoretical value of 0.5",
      "It drifts steadily away from 0.5",
      "It eventually reaches 1.0",
    ],
    correctIndex: 1,
    explanation:
      "By the Law of Large Numbers, the experimental (relative) frequency converges toward the theoretical probability (0.5) as the number of trials grows.",
  },
  {
    id: "cb-exp-vs-theo-die",
    prompt:
      "A die is rolled 60 times and shows a 'six' 14 times. By how much does the experimental probability exceed the theoretical probability of rolling a six?",
    options: ["About 0.07", "About 0.14", "About 0.17", "They are equal"],
    correctIndex: 0,
    explanation:
      "Experimental = 14/60 ≈ 0.233; theoretical = 1/6 ≈ 0.167. The difference is about 0.233 − 0.167 ≈ 0.07.",
  },
  {
    id: "cb-theo-die-prime",
    prompt: "Theoretically, what is the probability a single fair die shows a prime number?",
    options: ["1/6", "1/3", "1/2", "2/3"],
    correctIndex: 2,
    explanation: "The primes on a die are 2, 3, and 5 — that's 3 of 6 faces, so 3/6 = 1/2.",
  },

  // ── Sample spaces ──────────────────────────────────────────────────────
  {
    id: "cb-sample-three-coins",
    prompt: "How many equally likely outcomes are in the sample space when you flip three coins?",
    options: ["3", "6", "8", "9"],
    correctIndex: 2,
    explanation: "Each coin has 2 outcomes, so 2 × 2 × 2 = 2³ = 8 outcomes.",
  },
  {
    id: "cb-sample-coin-die",
    prompt: "You flip a coin and roll a die. How many outcomes are in the combined sample space?",
    options: ["6", "8", "12", "36"],
    correctIndex: 2,
    explanation: "By the counting principle: 2 coin outcomes × 6 die outcomes = 12.",
  },
  {
    id: "cb-sample-two-dice",
    prompt: "Rolling two distinguishable dice, how many ordered outcomes are in the sample space?",
    options: ["12", "21", "36", "42"],
    correctIndex: 2,
    explanation: "6 outcomes for the first die × 6 for the second = 36 ordered pairs.",
  },
  {
    id: "cb-sample-three-dice",
    prompt: "How many outcomes are in the sample space when rolling three dice?",
    options: ["18", "108", "216", "666"],
    correctIndex: 2,
    explanation: "6 × 6 × 6 = 6³ = 216 outcomes.",
  },
  {
    id: "cb-sample-spinner-die",
    prompt:
      "A spinner has 4 equal colored sectors. You spin it and roll a die. How big is the sample space?",
    options: ["10", "16", "24", "64"],
    correctIndex: 2,
    explanation: "4 spinner outcomes × 6 die outcomes = 24.",
  },
  {
    id: "cb-sample-pin-code",
    prompt:
      "How many different 4-digit PIN codes (digits 0–9, repeats allowed) are possible?",
    options: ["40", "5,040", "10,000", "100,000"],
    correctIndex: 2,
    explanation: "Each of the 4 positions has 10 choices: 10⁴ = 10,000.",
  },

  // ── Complement rule ────────────────────────────────────────────────────
  {
    id: "cb-complement-027",
    prompt:
      "The probability that it rains tomorrow is 0.27. What is the probability it does NOT rain?",
    options: ["0.27", "0.63", "0.73", "0.83"],
    correctIndex: 2,
    explanation: "P(not A) = 1 − P(A) = 1 − 0.27 = 0.73.",
  },
  {
    id: "cb-complement-six-3rolls",
    prompt:
      "You roll a fair die three times. What is the probability of getting at least one six?",
    options: ["30.6%", "42.1%", "50.0%", "57.9%"],
    correctIndex: 1,
    explanation:
      "P(no six) = (5/6)³ = 125/216 ≈ 0.579, so P(at least one six) = 1 − 0.579 ≈ 0.421 (42.1%).",
  },
  {
    id: "cb-complement-head-4flips",
    prompt: "If you flip a fair coin four times, what is the probability of getting at least one head?",
    options: ["1/2", "3/4", "7/8", "15/16"],
    correctIndex: 3,
    explanation: "P(no heads) = (1/2)⁴ = 1/16, so P(at least one head) = 1 − 1/16 = 15/16.",
  },
  {
    id: "cb-complement-no-double-six",
    prompt:
      "Rolling two dice, what is the probability you do NOT get a double-six (6 and 6)?",
    options: ["1/36", "11/36", "30/36", "35/36"],
    correctIndex: 3,
    explanation: "P(double six) = 1/36, so the complement is 1 − 1/36 = 35/36.",
  },

  // ── Compound & independent events ──────────────────────────────────────
  {
    id: "cb-indep-coin-die",
    prompt:
      "You flip a coin and roll a die. What is the probability of getting a head AND a six?",
    options: ["1/8", "1/12", "1/6", "7/12"],
    correctIndex: 1,
    explanation: "These are independent: P(head) × P(six) = (1/2)(1/6) = 1/12.",
  },
  {
    id: "cb-indep-two-events",
    prompt:
      "Events A and B are independent with P(A) = 0.4 and P(B) = 0.5. What is P(A and B)?",
    options: ["0.10", "0.20", "0.45", "0.90"],
    correctIndex: 1,
    explanation: "For independent events, P(A and B) = P(A)·P(B) = 0.4 × 0.5 = 0.20.",
  },
  {
    id: "cb-indep-three-spins",
    prompt:
      "A spinner lands on red with probability 0.3 each spin. What is the probability of three reds in a row?",
    options: ["0.009", "0.027", "0.09", "0.9"],
    correctIndex: 1,
    explanation: "Independent spins: 0.3 × 0.3 × 0.3 = 0.3³ = 0.027.",
  },
  {
    id: "cb-indep-both-high",
    prompt: "Rolling two dice, what is the probability both show a 5 or 6?",
    options: ["1/9", "1/6", "2/9", "1/3"],
    correctIndex: 0,
    explanation: "Each die shows 5 or 6 with probability 2/6 = 1/3; independent, so (1/3)(1/3) = 1/9.",
  },
  {
    id: "cb-indep-two-coins-die",
    prompt:
      "You flip two coins and roll a die. What is the probability of two heads and an even number?",
    options: ["1/8", "1/6", "1/12", "1/4"],
    correctIndex: 0,
    explanation: "P(two heads) = 1/4, P(even) = 1/2; independent, so (1/4)(1/2) = 1/8.",
  },

  // ── Mutually exclusive & the addition rule ─────────────────────────────
  {
    id: "cb-add-die-2or5",
    prompt: "On a single die roll, what is the probability of rolling a 2 or a 5?",
    options: ["1/6", "1/3", "1/2", "2/3"],
    correctIndex: 1,
    explanation: "These outcomes are mutually exclusive: 1/6 + 1/6 = 2/6 = 1/3.",
  },
  {
    id: "cb-add-king-or-queen",
    prompt: "Drawing one card from a 52-card deck, what is the probability it is a king or a queen?",
    options: ["1/13", "2/13", "4/13", "1/4"],
    correctIndex: 1,
    explanation:
      "Kings and queens are mutually exclusive: 4/52 + 4/52 = 8/52 = 2/13.",
  },
  {
    id: "cb-add-overlap",
    prompt:
      "P(A) = 0.5, P(B) = 0.4, and P(A and B) = 0.2. What is P(A or B)?",
    options: ["0.7", "0.8", "0.9", "1.1"],
    correctIndex: 0,
    explanation:
      "Addition rule: P(A or B) = P(A) + P(B) − P(A and B) = 0.5 + 0.4 − 0.2 = 0.7.",
  },
  {
    id: "cb-add-ace-or-spade",
    prompt:
      "Drawing one card, what is the probability it is an ace OR a spade?",
    options: ["4/13", "17/52", "1/4", "5/13"],
    correctIndex: 0,
    explanation:
      "P(ace) + P(spade) − P(ace of spades) = 4/52 + 13/52 − 1/52 = 16/52 = 4/13.",
  },
  {
    id: "cb-add-spade-or-face",
    prompt: "Drawing one card, what is the probability it is a spade OR a face card?",
    options: ["1/4", "11/26", "22/52 only counting spades", "3/13"],
    correctIndex: 1,
    explanation:
      "13 spades + 12 face cards − 3 spade face cards (J,Q,K of spades) = 22/52 = 11/26.",
  },

  // ── Conditional probability & Bayes ────────────────────────────────────
  {
    id: "cb-cond-second-king",
    prompt:
      "You draw a king and keep it. What is the probability the next card off the deck is also a king?",
    options: ["1/17", "3/52", "1/13", "4/51"],
    correctIndex: 0,
    explanation: "3 kings remain among 51 cards: 3/51 = 1/17.",
  },
  {
    id: "cb-cond-marble-second-red",
    prompt:
      "A bag holds 4 red and 6 blue marbles. You draw a red and don't replace it. What is the probability the next draw is also red?",
    options: ["1/3", "2/5", "3/10", "4/9"],
    correctIndex: 0,
    explanation: "After removing one red, 3 reds remain among 9 marbles: 3/9 = 1/3.",
  },
  {
    id: "cb-cond-two-children",
    prompt:
      "A family has two children. Given that at least one is a boy, what is the probability that both are boys?",
    options: ["1/4", "1/3", "1/2", "2/3"],
    correctIndex: 1,
    explanation:
      "Equally likely cases BB, BG, GB, GG. 'At least one boy' rules out GG, leaving 3 cases; only BB has both boys, so 1/3.",
  },
  {
    id: "cb-bayes-medical",
    prompt:
      "A disease affects 1% of people. A test is 99% accurate for both the sick and the healthy. Given a positive result, what is the probability you actually have the disease?",
    options: ["1%", "50%", "90%", "99%"],
    correctIndex: 1,
    explanation:
      "P(D|+) = (0.01·0.99) / (0.01·0.99 + 0.99·0.01) = 0.0099 / 0.0198 = 50%. The rare disease and the equal error rates make true and false positives equally common.",
  },
  {
    id: "cb-cond-formula",
    prompt: "If P(A and B) = 0.18 and P(B) = 0.3, what is P(A | B)?",
    options: ["0.054", "0.30", "0.48", "0.60"],
    correctIndex: 3,
    explanation: "P(A | B) = P(A and B) / P(B) = 0.18 / 0.3 = 0.6.",
  },
  {
    id: "cb-cond-defective",
    prompt:
      "Factory output: 60% from machine X (2% defective) and 40% from machine Y (5% defective). What is the overall probability a random item is defective?",
    options: ["2.0%", "3.2%", "3.5%", "5.0%"],
    correctIndex: 1,
    explanation:
      "Total = 0.6·0.02 + 0.4·0.05 = 0.012 + 0.020 = 0.032 = 3.2% (law of total probability).",
  },

  // ── Expected value ─────────────────────────────────────────────────────
  {
    id: "cb-ev-die-roll",
    prompt: "What is the expected value of a single fair six-sided die roll?",
    options: ["3.0", "3.5", "4.0", "4.5"],
    correctIndex: 1,
    explanation: "EV = (1+2+3+4+5+6)/6 = 21/6 = 3.5.",
  },
  {
    id: "cb-ev-fair-game",
    prompt:
      "A game costs $5 to play. You win $20 with probability 0.25, otherwise nothing. What is the expected net result per play?",
    options: ["−$5", "$0", "+$5", "+$15"],
    correctIndex: 1,
    explanation: "EV = 0.25 × $20 − $5 = $5 − $5 = $0 — a perfectly fair game.",
  },
  {
    id: "cb-ev-lottery",
    prompt:
      "A $2 raffle ticket pays $100 with probability 0.01 (and nothing otherwise). What is the expected net value of buying one ticket?",
    options: ["−$1.00", "−$0.50", "+$1.00", "+$98.00"],
    correctIndex: 0,
    explanation: "EV = 0.01 × $100 − $2 = $1 − $2 = −$1.00.",
  },
  {
    id: "cb-ev-roulette-red",
    prompt:
      "On American roulette (38 slots, 18 red), a $1 bet on red pays $1 profit if it wins. What is the expected value of the bet?",
    options: ["−$0.11", "−$0.053", "$0", "+$0.053"],
    correctIndex: 1,
    explanation:
      "EV = (18/38)(+1) + (20/38)(−1) = (18 − 20)/38 = −2/38 ≈ −$0.053 per dollar.",
  },
  {
    id: "cb-ev-two-prize",
    prompt:
      "A wheel pays $10 with probability 0.2, $5 with probability 0.5, and $0 otherwise. What is its expected payout?",
    options: ["$3.50", "$4.50", "$5.00", "$6.00"],
    correctIndex: 1,
    explanation: "EV = 0.2(10) + 0.5(5) + 0.3(0) = 2 + 2.5 + 0 = $4.50.",
  },
  {
    id: "cb-ev-insurance",
    prompt:
      "An insurer charges $120 for a policy that pays out $10,000 with probability 0.01. What is the insurer's expected profit per policy?",
    options: ["−$100", "$0", "+$20", "+$120"],
    correctIndex: 2,
    explanation: "EV = $120 − 0.01 × $10,000 = $120 − $100 = +$20 expected profit.",
  },
  {
    id: "cb-ev-two-dice-sum",
    prompt: "What is the expected value of the sum of two fair dice?",
    options: ["6", "6.5", "7", "7.5"],
    correctIndex: 2,
    explanation: "By linearity, E[sum] = 3.5 + 3.5 = 7.",
  },

  // ── Combinatorics ──────────────────────────────────────────────────────
  {
    id: "cb-comb-choose-8-3",
    prompt: "In how many ways can you choose a committee of 3 people from a group of 8?",
    options: ["24", "56", "120", "336"],
    correctIndex: 1,
    explanation: "C(8,3) = (8·7·6)/(3·2·1) = 336/6 = 56.",
  },
  {
    id: "cb-comb-arrange-5-books",
    prompt: "In how many distinct orders can you line up 5 different books on a shelf?",
    options: ["25", "60", "120", "720"],
    correctIndex: 2,
    explanation: "Arrangements of 5 distinct items = 5! = 120.",
  },
  {
    id: "cb-comb-perm-7-3",
    prompt:
      "How many ways can gold, silver, and bronze medals be awarded among 7 runners (order matters)?",
    options: ["21", "35", "210", "5,040"],
    correctIndex: 2,
    explanation: "Permutations P(7,3) = 7 · 6 · 5 = 210.",
  },
  {
    id: "cb-comb-handshakes",
    prompt: "If 10 people each shake hands once with every other person, how many handshakes occur?",
    options: ["45", "50", "90", "100"],
    correctIndex: 0,
    explanation: "Each handshake is a pair: C(10,2) = (10·9)/2 = 45.",
  },
  {
    id: "cb-comb-lottery",
    prompt:
      "A lottery draws 6 distinct numbers from 1–49 (order doesn't matter). How many possible draws are there?",
    options: ["720", "1,000,000", "13,983,816", "10,068,347,520"],
    correctIndex: 2,
    explanation: "C(49,6) = 13,983,816 — which is why the jackpot odds are so steep.",
  },
  {
    id: "cb-comb-binary-8",
    prompt: "How many different 8-bit binary strings are there?",
    options: ["16", "64", "256", "512"],
    correctIndex: 2,
    explanation: "Each of 8 bits has 2 values: 2⁸ = 256.",
  },
  {
    id: "cb-comb-pizza",
    prompt: "How many ways can you pick 3 toppings from a menu of 10 (no repeats, order irrelevant)?",
    options: ["30", "120", "720", "1,000"],
    correctIndex: 1,
    explanation: "C(10,3) = (10·9·8)/6 = 720/6 = 120.",
  },
  {
    id: "cb-comb-anagram-level",
    prompt: 'How many distinct arrangements are there of the letters in the word "LEVEL"?',
    options: ["20", "30", "60", "120"],
    correctIndex: 1,
    explanation: "5 letters with L and E each repeated twice: 5!/(2!·2!) = 120/4 = 30.",
  },
  {
    id: "cb-comb-poker-hands",
    prompt: "How many distinct 5-card poker hands can be dealt from a 52-card deck?",
    options: ["311,875,200", "2,598,960", "133,784,560", "52!"],
    correctIndex: 1,
    explanation: "Order doesn't matter: C(52,5) = 2,598,960.",
  },
  {
    id: "cb-comb-seat-circle",
    prompt:
      "In how many ways can 5 people be seated around a round table (rotations counted as the same)?",
    options: ["24", "60", "120", "720"],
    correctIndex: 0,
    explanation: "Circular arrangements of n people = (n−1)! = 4! = 24.",
  },

  // ── Cards ──────────────────────────────────────────────────────────────
  {
    id: "cb-card-face",
    prompt: "What is the probability that a single card drawn from a standard deck is a face card (J, Q, K)?",
    options: ["3/13", "1/4", "1/13", "4/13"],
    correctIndex: 0,
    explanation: "There are 12 face cards: 12/52 = 3/13.",
  },
  {
    id: "cb-card-two-hearts",
    prompt: "Drawing 2 cards without replacement, what is the probability both are hearts?",
    options: ["1/16", "1/17", "3/13", "1/4"],
    correctIndex: 1,
    explanation: "(13/52)(12/51) = (1/4)(12/51) = 12/204 = 1/17 ≈ 5.9%.",
  },
  {
    id: "cb-card-both-red",
    prompt: "Drawing 2 cards without replacement, what is the probability both are red?",
    options: ["1/4", "25/102", "1/2", "13/51"],
    correctIndex: 1,
    explanation: "(26/52)(25/51) = (1/2)(25/51) = 25/102 ≈ 24.5%.",
  },
  {
    id: "cb-card-neither-heart",
    prompt: "Drawing 2 cards without replacement, what is the probability that neither is a heart?",
    options: ["1/4", "9/16", "19/34", "3/4"],
    correctIndex: 2,
    explanation: "(39/52)(38/51) = (3/4)(38/51) = 114/204 = 19/34 ≈ 55.9%.",
  },
  {
    id: "cb-card-king-then-queen",
    prompt:
      "Drawing 2 cards without replacement, what is the probability of a king first and a queen second?",
    options: ["1/169", "4/663", "1/221", "2/663"],
    correctIndex: 1,
    explanation: "(4/52)(4/51) = 16/2652 = 4/663 ≈ 0.6%.",
  },

  // ── Dice ───────────────────────────────────────────────────────────────
  {
    id: "cb-dice-sum-7",
    prompt: "Rolling two dice, what is the probability the sum is 7?",
    options: ["1/12", "1/6", "1/9", "5/36"],
    correctIndex: 1,
    explanation: "There are 6 ways to roll a 7 out of 36 outcomes: 6/36 = 1/6.",
  },
  {
    id: "cb-dice-sum-2",
    prompt: "Rolling two dice, what is the probability the sum is 2?",
    options: ["1/36", "1/18", "1/12", "1/6"],
    correctIndex: 0,
    explanation: "Only (1,1) gives a sum of 2: 1/36.",
  },
  {
    id: "cb-dice-sum-11",
    prompt: "Rolling two dice, what is the probability the sum is 11?",
    options: ["1/36", "1/18", "1/12", "1/9"],
    correctIndex: 1,
    explanation: "(5,6) and (6,5) make 11: 2/36 = 1/18.",
  },
  {
    id: "cb-dice-doubles",
    prompt: "Rolling two dice, what is the probability of rolling doubles (both dice the same)?",
    options: ["1/12", "1/6", "1/3", "5/36"],
    correctIndex: 1,
    explanation: "There are 6 doubles (1-1 through 6-6) out of 36: 6/36 = 1/6.",
  },
  {
    id: "cb-dice-sum-multiple-3",
    prompt: "Rolling two dice, what is the probability the sum is a multiple of 3?",
    options: ["1/4", "1/3", "5/12", "1/2"],
    correctIndex: 1,
    explanation:
      "Sums 3, 6, 9, 12 occur in 2+5+4+1 = 12 of 36 outcomes: 12/36 = 1/3.",
  },
  {
    id: "cb-dice-sum-over-9",
    prompt: "Rolling two dice, what is the probability the sum is greater than 9?",
    options: ["1/12", "1/6", "1/4", "5/18"],
    correctIndex: 1,
    explanation: "Sums of 10, 11, 12 occur 3+2+1 = 6 times: 6/36 = 1/6.",
  },
  {
    id: "cb-dice-product-even",
    prompt: "Rolling two dice, what is the probability that the product of the two faces is even?",
    options: ["1/4", "1/2", "2/3", "3/4"],
    correctIndex: 3,
    explanation:
      "The product is odd only if both are odd: (1/2)(1/2) = 1/4. So P(even) = 1 − 1/4 = 3/4.",
  },
  {
    id: "cb-dice-at-least-one-6",
    prompt: "Rolling two dice, what is the probability of at least one six?",
    options: ["1/6", "11/36", "1/3", "1/2"],
    correctIndex: 1,
    explanation: "P(no six) = (5/6)² = 25/36, so P(at least one) = 11/36 ≈ 30.6%.",
  },

  // ── Coins ──────────────────────────────────────────────────────────────
  {
    id: "cb-coin-2-of-3",
    prompt: "Flipping a fair coin 3 times, what is the probability of exactly two heads?",
    options: ["1/8", "1/4", "3/8", "1/2"],
    correctIndex: 2,
    explanation: "C(3,2) = 3 favorable outcomes out of 8: 3/8.",
  },
  {
    id: "cb-coin-2-of-4",
    prompt: "Flipping a fair coin 4 times, what is the probability of exactly two heads?",
    options: ["1/4", "3/8", "1/2", "5/8"],
    correctIndex: 1,
    explanation: "C(4,2) = 6 out of 16 outcomes: 6/16 = 3/8.",
  },
  {
    id: "cb-coin-3-of-5",
    prompt: "Flipping a fair coin 5 times, what is the probability of exactly three heads?",
    options: ["1/4", "5/16", "3/8", "1/2"],
    correctIndex: 1,
    explanation: "C(5,3) = 10 out of 32 outcomes: 10/32 = 5/16.",
  },
  {
    id: "cb-coin-at-least-2-of-3",
    prompt: "Flipping a fair coin 3 times, what is the probability of at least two heads?",
    options: ["3/8", "1/2", "5/8", "7/8"],
    correctIndex: 1,
    explanation: "Two heads (3 ways) + three heads (1 way) = 4 of 8 = 1/2.",
  },
  {
    id: "cb-coin-first-head-third",
    prompt: "Flipping a fair coin, what is the probability the first head appears on exactly the third flip?",
    options: ["1/8", "1/6", "1/4", "1/2"],
    correctIndex: 0,
    explanation: "You need T, T, then H: (1/2)(1/2)(1/2) = 1/8.",
  },
  {
    id: "cb-coin-six-tails",
    prompt: "What is the probability of flipping six tails in a row with a fair coin?",
    options: ["1/16", "1/32", "1/64", "1/128"],
    correctIndex: 2,
    explanation: "(1/2)⁶ = 1/64.",
  },

  // ── Marbles / urns ─────────────────────────────────────────────────────
  {
    id: "cb-marble-one-red",
    prompt: "A bag has 3 red and 2 blue marbles. What is the probability a single draw is red?",
    options: ["2/5", "1/2", "3/5", "2/3"],
    correctIndex: 2,
    explanation: "3 red out of 5 marbles: 3/5.",
  },
  {
    id: "cb-marble-two-red",
    prompt:
      "A bag has 3 red and 2 blue marbles. Drawing 2 without replacement, what is the probability both are red?",
    options: ["3/10", "9/25", "2/5", "1/2"],
    correctIndex: 0,
    explanation: "(3/5)(2/4) = 6/20 = 3/10.",
  },
  {
    id: "cb-marble-red-then-blue",
    prompt:
      "A bag has 4 red and 6 blue marbles. Drawing 2 without replacement, what is the probability of red then blue?",
    options: ["6/25", "4/15", "2/5", "1/3"],
    correctIndex: 1,
    explanation: "(4/10)(6/9) = 24/90 = 4/15 ≈ 0.267.",
  },
  {
    id: "cb-marble-replacement",
    prompt:
      "A bag has 5 red and 5 green marbles. Drawing 2 WITH replacement, what is the probability both are red?",
    options: ["1/4", "2/9", "5/18", "1/2"],
    correctIndex: 0,
    explanation: "With replacement the draws are independent: (1/2)(1/2) = 1/4.",
  },
  {
    id: "cb-marble-at-least-one-red",
    prompt:
      "A bag has 2 red and 3 white marbles. Drawing 2 without replacement, what is the probability of at least one red?",
    options: ["3/10", "2/5", "1/2", "7/10"],
    correctIndex: 3,
    explanation:
      "P(no red) = (3/5)(2/4) = 6/20 = 3/10, so P(at least one red) = 1 − 3/10 = 7/10.",
  },

  // ── Geometric / uniform probability ────────────────────────────────────
  {
    id: "cb-geo-dartboard",
    prompt:
      "A circular dartboard has radius 10 cm with a bullseye of radius 2 cm. For a uniformly random hit, what is the probability of hitting the bullseye?",
    options: ["2%", "4%", "20%", "40%"],
    correctIndex: 1,
    explanation: "Probability = area ratio = (2/10)² = 0.04 = 4%.",
  },
  {
    id: "cb-geo-number-line",
    prompt:
      "A point is chosen uniformly at random on the segment [0, 10]. What is the probability it lands in [3, 5]?",
    options: ["0.1", "0.2", "0.3", "0.5"],
    correctIndex: 1,
    explanation: "Length 2 out of length 10: 2/10 = 0.2.",
  },
  {
    id: "cb-geo-circle-in-square",
    prompt:
      "A circle is inscribed in a square. For a uniformly random point in the square, what is the probability it falls inside the circle?",
    options: ["About 0.64", "About 0.71", "About 0.79", "Exactly 0.50"],
    correctIndex: 2,
    explanation: "Ratio = (area of circle)/(area of square) = π·r² / (2r)² = π/4 ≈ 0.785.",
  },

  // ── Odds ↔ probability ─────────────────────────────────────────────────
  {
    id: "cb-odds-against-3to1",
    prompt: "If the odds against an event are 3:1, what is the probability the event happens?",
    options: ["1/4", "1/3", "1/2", "3/4"],
    correctIndex: 0,
    explanation: "Odds against 3:1 means 3 unfavorable to 1 favorable, so P = 1/(3+1) = 1/4.",
  },
  {
    id: "cb-odds-from-prob",
    prompt: "An event has probability 0.2. What are the odds in favor of it?",
    options: ["1:4", "1:5", "4:1", "5:1"],
    correctIndex: 0,
    explanation: "Odds in favor = P : (1−P) = 0.2 : 0.8 = 1 : 4.",
  },

  // ── Birthday & counting intuition ──────────────────────────────────────
  {
    id: "cb-birthday-23",
    prompt:
      "In a room of 23 people, the probability that at least two share a birthday is closest to:",
    options: ["6%", "23%", "50%", "99%"],
    correctIndex: 2,
    explanation:
      "The classic 'birthday problem': with 23 people the probability is about 50.7% — surprisingly high.",
  },
  {
    id: "cb-monty-hall",
    prompt:
      "In the Monty Hall problem you pick 1 of 3 doors, the host opens a different door revealing a goat, then offers a switch. What is your probability of winning the car if you switch?",
    options: ["1/3", "1/2", "2/3", "3/4"],
    correctIndex: 2,
    explanation:
      "Your first pick wins 1/3 of the time, so the other (unopened) door holds the car 2/3 of the time. Switching wins 2/3.",
  },

  // ── More poker math ────────────────────────────────────────────────────
  {
    id: "cb-flop-pair-AK",
    prompt:
      "Holding A-K (unpaired), what is the probability you pair at least one of them on the flop?",
    options: ["18.0%", "26.0%", "32.4%", "41.0%"],
    correctIndex: 2,
    explanation:
      "6 cards pair you (3 aces, 3 kings). P(none) = C(44,3)/C(50,3) = 13244/19600 ≈ 0.676, so ≈ 32.4%.",
  },
  {
    id: "cb-suited-flop-flush",
    prompt: "Holding two suited cards, what is the probability of flopping a flush (3 more of your suit)?",
    options: ["0.84%", "2.0%", "5.2%", "11.0%"],
    correctIndex: 0,
    explanation: "C(11,3)/C(50,3) = 165/19600 ≈ 0.0084 = 0.84%.",
  },
  {
    id: "cb-suited-flop-flushdraw",
    prompt:
      "Holding two suited cards, what is the probability of flopping a flush DRAW (exactly two more of your suit)?",
    options: ["4.2%", "10.9%", "19.0%", "35.0%"],
    correctIndex: 1,
    explanation: "C(11,2)·C(39,1)/C(50,3) = (55·39)/19600 = 2145/19600 ≈ 10.9%.",
  },
  {
    id: "cb-turn-card-outs",
    prompt:
      "You have 8 outs after the flop with two cards (turn and river) to come. Using the 'rule of 4', what's your rough equity?",
    options: ["About 16%", "About 24%", "About 32%", "About 48%"],
    correctIndex: 2,
    explanation:
      "The rule of 4: with two cards to come, multiply outs by ~4 → 8 × 4 ≈ 32% (the exact figure is ~31.5%).",
  },
  {
    id: "cb-implied-odds-call",
    prompt:
      "The pot is $80 and your opponent bets $20. What is the minimum equity you need to call profitably?",
    options: ["10%", "16.7%", "20%", "25%"],
    correctIndex: 1,
    explanation: "You risk $20 to win $100 already in: required equity = 20/(100+20) = 20/120 ≈ 16.7%.",
  },
  {
    id: "cb-gutshot-river",
    prompt:
      "You have a gutshot straight draw (4 outs) on the turn with only the river to come. What is your approximate equity?",
    options: ["4.3%", "8.7%", "16.0%", "17.0%"],
    correctIndex: 1,
    explanation: "With 46 unseen cards: 4/46 ≈ 8.7% (the rule of 2 gives 4 × 2 = 8%, close).",
  },

  // ── More fundamentals to round out the bank ────────────────────────────
  {
    id: "cb-coin-exactly-1-of-4",
    prompt: "Flipping a fair coin 4 times, what is the probability of exactly one head?",
    options: ["1/16", "1/8", "1/4", "3/8"],
    correctIndex: 2,
    explanation: "C(4,1) = 4 favorable outcomes out of 16: 4/16 = 1/4.",
  },
  {
    id: "cb-coin-hth-sequence",
    prompt: "Flipping a fair coin 3 times, what is the probability of getting exactly the sequence H, T, H?",
    options: ["1/8", "1/6", "3/8", "1/2"],
    correctIndex: 0,
    explanation: "One specific ordered sequence out of 8 equally likely outcomes: 1/8.",
  },
  {
    id: "cb-die-not-3",
    prompt: "On a single die roll, what is the probability of NOT rolling a 3?",
    options: ["1/6", "1/2", "2/3", "5/6"],
    correctIndex: 3,
    explanation: "P(not 3) = 1 − 1/6 = 5/6.",
  },
  {
    id: "cb-die-greater-4",
    prompt: "On a single die roll, what is the probability of rolling a number greater than 4?",
    options: ["1/6", "1/3", "1/2", "2/3"],
    correctIndex: 1,
    explanation: "The faces 5 and 6 qualify: 2/6 = 1/3.",
  },
  {
    id: "cb-card-ace",
    prompt: "What is the probability a single card drawn from a standard deck is an ace?",
    options: ["1/52", "1/13", "1/4", "4/13"],
    correctIndex: 1,
    explanation: "There are 4 aces in 52 cards: 4/52 = 1/13.",
  },
  {
    id: "cb-card-red",
    prompt: "What is the probability a single card drawn from a standard deck is red?",
    options: ["1/4", "13/52", "1/2", "26/51"],
    correctIndex: 2,
    explanation: "26 red cards out of 52: 26/52 = 1/2.",
  },
  {
    id: "cb-cond-spade-given-black",
    prompt: "Given that a drawn card is black, what is the probability it is a spade?",
    options: ["1/4", "1/2", "13/52", "2/3"],
    correctIndex: 1,
    explanation: "Among the 26 black cards, 13 are spades: 13/26 = 1/2.",
  },
  {
    id: "cb-dice-sum-odd",
    prompt: "Rolling two dice, what is the probability the sum is odd?",
    options: ["1/4", "1/3", "1/2", "5/9"],
    correctIndex: 2,
    explanation: "An odd sum needs one even and one odd die; this happens in 18 of 36 outcomes: 1/2.",
  },
  {
    id: "cb-dice-both-even",
    prompt: "Rolling two dice, what is the probability both faces are even?",
    options: ["1/4", "1/3", "1/2", "9/36 only by luck"],
    correctIndex: 0,
    explanation: "Each die is even with probability 1/2; independent, so (1/2)(1/2) = 1/4.",
  },
  {
    id: "cb-comb-true-false",
    prompt: "In how many ways can a student answer a 6-question true/false quiz?",
    options: ["12", "36", "64", "720"],
    correctIndex: 2,
    explanation: "Each question has 2 choices: 2⁶ = 64.",
  },
  {
    id: "cb-comb-license-plate",
    prompt:
      "A plate has 3 letters (A–Z) followed by 3 digits (0–9), repeats allowed. How many plates are possible?",
    options: ["46,656", "1,757,600", "17,576,000", "26,000,000"],
    correctIndex: 2,
    explanation: "26³ × 10³ = 17,576 × 1,000 = 17,576,000.",
  },
  {
    id: "cb-binomial-mean-flips",
    prompt: "If you flip a fair coin 20 times, what is the expected number of heads?",
    options: ["5", "10", "15", "20"],
    correctIndex: 1,
    explanation: "Expected value of a binomial = n·p = 20 × 0.5 = 10.",
  },
  {
    id: "cb-expected-defects",
    prompt:
      "A process produces defects 3% of the time. In a batch of 100 items, what is the expected number of defective items?",
    options: ["0.3", "3", "30", "97"],
    correctIndex: 1,
    explanation: "Expected count = n·p = 100 × 0.03 = 3.",
  },
  {
    id: "cb-geometric-second-trial",
    prompt:
      "You repeatedly flip a fair coin until the first head. What is the probability the first head occurs on exactly the second flip?",
    options: ["1/8", "1/4", "1/2", "3/4"],
    correctIndex: 1,
    explanation: "You need T then H: (1/2)(1/2) = 1/4.",
  },
  {
    id: "cb-coin-game-ev",
    prompt:
      "You win $1 for every head over 10 fair coin flips. What is your expected winnings?",
    options: ["$2.50", "$5.00", "$7.50", "$10.00"],
    correctIndex: 1,
    explanation: "Expected heads = 10 × 0.5 = 5, so expected winnings = $5.00.",
  },
  {
    id: "cb-complement-at-least-one-tail-3",
    prompt: "Flipping a fair coin 3 times, what is the probability of at least one tail?",
    options: ["1/2", "5/8", "3/4", "7/8"],
    correctIndex: 3,
    explanation: "P(no tails) = (1/2)³ = 1/8, so P(at least one tail) = 1 − 1/8 = 7/8.",
  },
  {
    id: "cb-spinner-uniform-quarter",
    prompt:
      "A spinner has 4 equal sectors numbered 1–4. What is the probability of NOT landing on 1?",
    options: ["1/4", "1/2", "2/3", "3/4"],
    correctIndex: 3,
    explanation: "P(not 1) = 1 − 1/4 = 3/4.",
  },
];

/** Lowest table tier's min buy-in — the line below which a player is 'broke'. */
export const REBUY_THRESHOLD =
  TABLE_TIERS.reduce(
    (min, t) => Math.min(min, t.minBuyIn),
    TABLE_TIERS[0]?.minBuyIn ?? 200,
  ) || 200;

/** How many questions to serve per comeback attempt. */
export const COMEBACK_QUESTION_COUNT = 5;

/** Tokens granted on a passing attempt — enough to rebuy the Beginner's Table. */
export const COMEBACK_REWARD = 500;

/** Number of correct answers required to pass (all but one). */
export function passingScore(total: number): number {
  return Math.max(1, total - 1);
}

/** True when the player is broke enough to deserve a comeback reward. */
export function isBroke(progress: CourseProgress): boolean {
  return tokenBalance(progress) < REBUY_THRESHOLD;
}

/** A question whose options have been shuffled for a single attempt. */
export interface ServedQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

/** Fisher–Yates shuffle returning a new array (does not mutate the input). */
export function shuffle<T>(input: readonly T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Shuffle a question's options and recompute the correct index. */
function shuffleOptions(q: ComebackQuestion): ServedQuestion {
  const correctValue = q.options[q.correctIndex];
  const options = shuffle(q.options);
  return {
    id: q.id,
    prompt: q.prompt,
    options,
    correctIndex: options.indexOf(correctValue),
    explanation: q.explanation,
  };
}

/**
 * IDs served in recent attempts, most-recent first. We exclude these from the
 * next draw so the player keeps seeing fresh questions. The memory window is a
 * few sessions deep but never so large that it could starve the draw.
 */
let recentlyServedIds: string[] = [];

/**
 * How many recently-served question IDs to remember and avoid. Kept to a few
 * sessions' worth, and always capped so the live pool can still fill a draw.
 */
function recentMemorySize(count: number): number {
  // Remember roughly three sessions of questions, but leave plenty of the bank
  // available so every fresh draw can avoid all recently-used IDs.
  const desired = count * 3;
  const maxSafe = Math.max(count, COMEBACK_QUESTIONS.length - count);
  return Math.min(desired, maxSafe);
}

/** Test/utility hook: forget the recently-served history. */
export function resetComebackHistory(): void {
  recentlyServedIds = [];
}

/**
 * Draw a random subset of `count` questions for one attempt, with both the
 * question order and each question's options shuffled.
 *
 * Selection guarantees:
 * - No question repeats *within* a single attempt (we draw distinct items).
 * - Questions served in recent attempts are excluded where possible, so two
 *   consecutive sessions overlap by at most one question (and usually zero).
 * The draw uses a Fisher–Yates shuffle over the eligible pool.
 */
export function drawComebackQuestions(
  count: number = COMEBACK_QUESTION_COUNT,
): ServedQuestion[] {
  const n = Math.min(count, COMEBACK_QUESTIONS.length);

  const recent = new Set(recentlyServedIds);
  const fresh = COMEBACK_QUESTIONS.filter((q) => !recent.has(q.id));

  // Prefer questions that haven't been seen recently. If the fresh pool can't
  // fill the draw (tiny bank or large count), top up from the rest.
  const chosen = shuffle(fresh).slice(0, n);
  if (chosen.length < n) {
    const stale = shuffle(COMEBACK_QUESTIONS.filter((q) => recent.has(q.id)));
    chosen.push(...stale.slice(0, n - chosen.length));
  }

  // Record what we served (newest first) and trim the memory window.
  recentlyServedIds = [
    ...chosen.map((q) => q.id),
    ...recentlyServedIds,
  ].slice(0, recentMemorySize(n));

  return chosen.map(shuffleOptions);
}
