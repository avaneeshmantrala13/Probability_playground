/**
 * One-shot generator for Poker Theory lesson JSON files.
 * Run: node scripts/generate-poker-theory.mjs
 */
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "content", "pokerTheory");

function q(id, kind, concept, question, options, correct, expl, rem1, rem2) {
  return {
    id,
    kind,
    concept,
    question,
    options,
    correctAnswer: correct,
    explanations: expl,
    remediation: [rem1, rem2],
  };
}

function rem(id, question, options, correct, expl) {
  return { id, question, options, correctAnswer: correct, explanations: expl };
}

function pq(id, concept, question, options, correct, expl) {
  return { id, concept, question, options, correctAnswer: correct, explanations: expl };
}

function expl(a, b, c, d) {
  return { A: a, B: b, C: c, D: d };
}

const lessons = [
  {
    lessonId: "pt_fundamentals",
    order: 1,
    title: "Poker Fundamentals",
    subtitle: "Rules, streets, and how a hand unfolds",
    topics: ["Texas Hold'em rules", "Blinds", "Streets", "Showdown"],
    intro: [
      "Texas Hold'em is the most widely studied poker variant. Each player receives two private hole cards, then five community cards are dealt in stages: the flop (three cards), the turn (one card), and the river (one card).",
      "Betting happens before the flop (preflop), after the flop, after the turn, and after the river. You win by making the best five-card hand from your hole cards plus the board, or by being the last player remaining after everyone else folds.",
      "Understanding the flow of a hand — who acts when, what the blinds are, and when cards are revealed — is the foundation for every strategic concept that follows.",
    ],
    questions: [
      q("pt_f1_q1", "standard", "hole_cards", "How many private hole cards does each player receive in Texas Hold'em?", ["1", "2", "4", "5"], 1, expl("Hold'em uses one private card per player only in exotic variants; standard Texas Hold'em always deals two.", "Correct. Every player gets exactly two hole cards that only they may look at until showdown.", "Four hole cards is Omaha, not Hold'em.", "Five private cards would leave no community cards for the shared board."), rem("pt_f1_q1_r1", "At the start of a Hold'em hand, each player is dealt this many face-down cards:", ["2", "3", "5", "7"], 0, expl("Correct — two hole cards.", "Three is not standard Hold'em.", "Five is the community board total, not hole cards.", "Seven is used in some stud games, not Hold'em.")), rem("pt_f1_q1_r2", "Your hidden cards in Texas Hold'em are called hole cards. How many do you get?", ["1", "2", "4", "6"], 1, expl("One hole card isn't Hold'em.", "Correct — exactly two hole cards.", "Four hole cards describes Omaha.", "Six isn't a standard deal in Hold'em."))),
      q("pt_f1_q2", "standard", "community_cards", "How many community cards are dealt on the board in a full Texas Hold'em hand?", ["3", "4", "5", "7"], 2, expl("Three is only the flop; the turn and river add two more.", "Four is still missing the river.", "Correct — flop (3) + turn (1) + river (1) = 5 community cards.", "Seven would exceed a standard deck's shared cards."), rem("pt_f1_q2_r1", "The flop shows three community cards. After the turn and river, the board has:", ["4 cards", "5 cards", "6 cards", "7 cards"], 1, expl("Four is only through the turn.", "Correct — five total community cards.", "Six isn't standard.", "Seven isn't standard.")), rem("pt_f1_q2_r2", "In Hold'em you combine your hole cards with community cards. The board ends with:", ["3 cards", "4 cards", "5 cards", "6 cards"], 2, expl("Three is just the flop.", "Four is missing the river.", "Correct — five community cards total.", "Six isn't used in Hold'em."))),
      q("pt_f1_q3", "standard", "streets", "What is the correct order of betting rounds in Hold'em?", ["Preflop → Turn → Flop → River", "Preflop → Flop → Turn → River", "Flop → Preflop → Turn → River", "Preflop → Flop → River → Turn"], 1, expl("Turn before flop is wrong.", "Correct — preflop, then flop, turn, and river.", "Flop never comes before preflop.", "River always comes after the turn.")), rem("pt_f1_q3_r1", "After hole cards are dealt, the first betting round is:", ["The flop", "Preflop", "The river", "Showdown"], 1, expl("Flop is second.", "Correct — betting starts preflop.", "River is near the end.", "Showdown follows all betting.")), rem("pt_f1_q3_r2", "The turn is dealt after which street?", ["Preflop", "The flop", "The river", "Showdown"], 1, expl("Preflop has no community cards yet.", "Correct — flop, then turn.", "River comes after the turn.", "Showdown is last."))),
      q("pt_f1_q4", "standard", "blinds", "In a $1/$2 cash game, the small blind posts:", ["$1", "$2", "$0.50", "$3"], 0, expl("Correct — the first number is the small blind.", "The big blind is $2.", "$0.50 isn't the posted blind here.", "$3 isn't standard for this structure.")), rem("pt_f1_q4_r1", "The player directly left of the dealer posts the small blind of:", ["$1", "$2", "Half the big blind only in tournaments", "$0"], 0, expl("Correct in a $1/$2 game.", "That's the big blind.", "Cash games use fixed blinds as labeled.", "Blinds are mandatory forced bets.")), rem("pt_f1_q4_r2", "In $1/$2, the big blind is:", ["$1", "$2", "$4", "$0.50"], 1, expl("$1 is the small blind.", "Correct — the second number is the big blind.", "$4 isn't labeled.", "$0.50 isn't the big blind here."))),
      q("pt_f1_q5", "standard", "showdown", "At showdown, a player must show cards to win the pot if:", ["They were the last aggressor on the river", "They are called and have the best hand or a bluff is challenged", "They folded on the turn", "They checked preflop"], 1, expl("Last aggressor rule applies to who shows first, not whether showing is required.", "Correct — if you're called at showdown you must table a hand to claim the pot.", "Folded players cannot win.", "Checking preflop doesn't determine showdown eligibility.")), rem("pt_f1_q5_r1", "If you bet the river and get called, you generally must:", ["Muck without showing", "Show your hand to win", "Fold automatically", "Reveal one card only"], 1, expl("You can't win without showing when called.", "Correct — table your cards to claim the pot.", "You didn't fold; you were called.", "Full hand is shown at showdown.")), rem("pt_f1_q5_r2", "A player who folded before the river:", ["Can still win if they had the nuts", "Is out of the hand", "Shows cards anyway", "Posts another blind"], 1, expl("Folded means out of the hand.", "Correct — once you fold you cannot win the pot.", "No need to show after folding.", "Blinds apply to new hands."))),
      q("pt_f1_q6", "standard", "best_five", "You hold A♠ K♦ and the board is Q♠ J♠ T♥ 2♣ 7♦. Your best five-card hand is:", ["High card ace", "A straight", "A flush", "Two pair"], 1, expl("You use all five board cards plus none needed — actually A-K completes Broadway: A-K-Q-J-T.", "Correct — you have a Broadway straight (A high).", "No five spades; not a flush.", "Two pair isn't your best five here.")), rem("pt_f1_q6_r1", "Hole cards A-K on board Q-J-T-x-x makes:", ["Pair of aces", "Straight", "Full house", "Flush draw only"], 1, expl("Pair ignores the straight.", "Correct — A-K-Q-J-T is a straight.", "No pair for a boat.", "No flush completed.")), rem("pt_f1_q6_r2", "You may use zero, one, or two hole cards to make your best hand. Here A-K with Q-J-T uses:", ["0 hole cards", "1 hole card", "2 hole cards", "Must use both always"], 2, expl("Board alone is Q-J-T high card.", "One card can't beat the straight.", "Correct — both A and K complete the straight.", "You choose the best five, not always both."))),
      q("pt_f1_q7", "standard", "actions", "Which action keeps you in the hand without putting more chips in (when no bet faces you)?", ["Fold", "Check", "Raise", "Muck"], 1, expl("Fold ends your participation.", "Correct — check passes action with no additional chips.", "Raise adds chips.", "Muck is surrendering at showdown.")), rem("pt_f1_q7_r1", "When no one has bet this street, you may:", ["Check", "Fold only", "Must bet", "Show cards"], 0, expl("Correct — check is allowed.", "Fold is allowed but not required.", "Betting is optional.", "Showdown isn't now.")), rem("pt_f1_q7_r2", "Facing no bet, checking means:", ["You forfeit the pot", "You stay in without adding chips", "You must call", "You win automatically"], 1, expl("Forfeit is fold.", "Correct — pass action, stay in.", "Nothing to call.", "Check doesn't win the pot."))),
      q("pt_f1_q8", "standard", "side_pots", "Three players remain. Short stack goes all-in for $50, two deeper stacks build a $200 side pot. Who can win the side pot?", ["Only the short stack", "Only the two deeper players", "All three players", "The dealer"], 1, expl("Short stack wasn't eligible for chips beyond their $50.", "Correct — only players who matched the extra action contest the side pot.", "Short stack can't win chips they didn't cover.", "Dealer doesn't play.")), rem("pt_f1_q8_r1", "Side pots exist when:", ["Everyone has equal stacks", "A player is all-in for less than others continue betting", "The board pairs", "Blinds are posted"], 1, expl("Equal stacks don't create sides.", "Correct — unequal all-ins create side pots.", "Board pairing is unrelated.", "Blinds start the hand.")), rem("pt_f1_q8_r2", "The main pot is contested by:", ["Only the biggest stack", "Every player who matched the shortest all-in", "Folded players", "Nobody"], 1, expl("All matched players can win main.", "Correct — all who put in up to the short stack amount.", "Folded players are out.", "Main pot always has eligible players."))),
      q("pt_f1_q9", "challenge", "button_advantage", "Why is the dealer button considered valuable?", ["It posts the big blind next hand", "It acts last on postflop streets", "It sees hole cards first", "It always wins ties"], 1, expl("Button moves each hand; blind posting isn't the advantage.", "Correct — acting last postflop lets you see others' actions first.", "Deal order isn't strategic advantage.", "Ties split; button doesn't win.")), rem("pt_f1_q9_r1", "Postflop, the button typically acts:", ["First", "Last among remaining players", "Only on the river", "Never"], 1, expl("First is out of position.", "Correct — last to act is the advantage.", "Button acts every postflop street.", "Button always has a seat.")), rem("pt_f1_q9_r2", "Acting last on the flop lets you:", ["See opponents' actions before deciding", "Deal the turn", "Skip the blind", "Show cards early"], 0, expl("Correct — information advantage.", "Dealer deals but that's not the strategic edge.", "Blinds still apply.", "Showdown is later."))),
      q("pt_f1_q10", "challenge", "all_in_rules", "Player A shoves all-in for $100. Player B has $300 and calls. Player C has $500 and raises to $250 total. What happens?", ["C's raise is illegal", "B may only call $100 unless they have chips to match C", "C wins automatically", "Hand ends preflop"], 1, expl("Raises are legal if C has chips.", "Correct — B must match available action; side pots may form if B can't cover full raise.", "No automatic win.", "Hand continues with remaining action.")), rem("pt_f1_q10_r1", "When a short all-in doesn't reopen betting, a full raise:", ["Always reopens action for players who already acted", "May not reopens if the raise increment is insufficient", "Ends the hand", "Only the dealer can call"], 1, expl("Reopening depends on raise size rules.", "Correct — insufficient raises may not reopen.", "Hand continues.", "Players act, not dealer.")), rem("pt_f1_q10_r2", "Multiple all-ins at different stack depths usually create:", ["One pot only", "Main and side pots", "No pot", "Split pots always"], 1, expl("Different amounts create sides.", "Correct — main pot plus side pot(s).", "Pots always exist.", "Split only at showdown if tied."))),
    ],
    placementQuestions: [
      pq("pt_f1_p1", "hole_cards", "Each Hold'em player receives how many hole cards?", ["1", "2", "3", "5"], 1, expl("One isn't Hold'em.", "Correct.", "Three isn't standard.", "Five is the board total.")),
      pq("pt_f1_p2", "community", "Total community cards on the board:", ["3", "4", "5", "6"], 2, expl("Three is flop only.", "Four is through turn.", "Correct.", "Six isn't standard.")),
      pq("pt_f1_p3", "streets", "First betting round:", ["Flop", "Preflop", "River", "Showdown"], 1, expl("Flop is second.", "Correct.", "River is late.", "Showdown is last.")),
      pq("pt_f1_p4", "blinds", "$2/$5 game: small blind is:", ["$2", "$5", "$1", "$2.50"], 0, expl("Correct — first number.", "That's the big blind.", "$1 isn't labeled.", "$2.50 isn't standard.")),
      pq("pt_f1_p5", "showdown", "To win when called on the river you must:", ["Fold", "Show a hand", "Post a blind", "Check only"], 1, expl("Fold loses.", "Correct.", "Blinds are pre-hand.", "Check doesn't claim a bet pot alone.")),
      pq("pt_f1_p6", "best_five", "Best hand uses at most how many hole cards?", ["0", "1", "2", "5"], 2, expl("Zero is possible (play the board).", "One is common.", "Correct — maximum two.", "Five hole cards isn't Hold'em.")),
      pq("pt_f1_p7", "actions", "No bet facing you — you can:", ["Check", "Must fold", "Must raise", "Win pot"], 0, expl("Correct.", "Fold optional.", "Raise optional.", "Doesn't win yet.")),
      pq("pt_f1_p8", "button", "The button acts postflop:", ["First", "Last (among players in hand)", "Never", "Only preflop"], 1, expl("First is wrong.", "Correct.", "Button acts postflop.", "Button acts both.")),
    ],
  },
  // Additional lessons will be appended by the script continuation...
];

// Write only first lesson for now - we'll expand in the full script
for (const lesson of lessons) {
  const path = join(outDir, `${lesson.lessonId}.json`);
  writeFileSync(path, JSON.stringify(lesson, null, 2) + "\n");
  console.log("Wrote", path);
}
