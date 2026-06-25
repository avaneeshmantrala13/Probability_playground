import type { Persona, PersonaLines } from "./types";

/**
 * Bot personalities are 100% CLIENT-SIDE, canned/templated quip arrays — there
 * are NO network or LLM calls at runtime (Firebase Spark has no API keys).
 *
 * Personality only flavors the table-talk and nudges aggression/bluff knobs;
 * the actual fold/check/call/bet/raise decision is always driven by the
 * equity + pot-odds math in `bot.ts` and can NEVER be overridden by flavor.
 */

function lines(partial: Partial<PersonaLines>): PersonaLines {
  return {
    raise: partial.raise ?? ["Raise."],
    bet: partial.bet ?? ["I'll bet."],
    call: partial.call ?? ["Call."],
    check: partial.check ?? ["Check."],
    fold: partial.fold ?? ["Fold."],
    win: partial.win ?? ["Ship it."],
    bluffCaught: partial.bluffCaught ?? ["You got me."],
    greet: partial.greet ?? ["Good luck."],
  };
}

export const PERSONAS: Persona[] = [
  {
    id: "dealer-dot",
    name: "Dot (Host)",
    avatar: "🎩",
    aggression: 0.5,
    bluffFreq: 0.1,
    tightness: 0.5,
    isHost: true,
    lines: lines({
      greet: [
        "Welcome to Poker Night! I'm Dot, I'll deal. Play smart out there.",
        "Cards in the air! Remember: pot odds are your friend.",
        "Glad you made it. Let's shuffle up and deal.",
      ],
      raise: ["Let's make it interesting.", "I'll put in a raise.", "Bumping it up."],
      bet: ["A friendly little bet.", "I'll lead out here.", "Let's see a bet."],
      call: ["I'll come along.", "Curiosity calls.", "I'll see that."],
      check: ["Check to you.", "I'll tap the table.", "Free card, anyone?"],
      fold: ["Not this time.", "I'll let it go.", "Too rich for me."],
      win: ["Nice hand, everyone!", "That one's mine — well played.", "The pot comes home."],
      bluffCaught: ["Ha! You caught me.", "Worth a try, right?"],
    }),
  },
  {
    id: "rocky",
    name: "Rocky",
    avatar: "🥊",
    aggression: 0.85,
    bluffFreq: 0.35,
    tightness: 0.35,
    lines: lines({
      raise: ["RAISE. Feel the pressure.", "Boom — more chips.", "I'm coming after you."],
      bet: ["Bet. Don't blink.", "Pay to see the next one.", "Firing again."],
      call: ["Yeah, I'll call.", "You're not scaring me.", "Let's dance."],
      check: ["Check… for now.", "I'll wait to pounce."],
      fold: ["Tch. Fold.", "Take it.", "I'll get you next hand."],
      win: ["THAT'S what I'm talking about!", "Too strong!", "Ship the whole thing."],
      bluffCaught: ["Lucky read.", "You'll regret calling that."],
    }),
  },
  {
    id: "nova",
    name: "Nova",
    avatar: "🧮",
    aggression: 0.55,
    bluffFreq: 0.12,
    tightness: 0.62,
    lines: lines({
      raise: ["The math says raise.", "+EV. Raising.", "Value is value."],
      bet: ["Betting for value.", "Optimal sizing here.", "This is a bet."],
      call: ["Pot odds justify a call.", "Calling — correct price.", "I'm priced in."],
      check: ["Check. Pot control.", "No edge to bet — check."],
      fold: ["Negative EV. Fold.", "Easy laydown.", "The numbers fold."],
      win: ["As calculated.", "Variance, meet expectation.", "Books balanced."],
      bluffCaught: ["A rare miscalculation.", "You found a hero call."],
    }),
  },
  {
    id: "lucky",
    name: "Lucky",
    avatar: "🍀",
    aggression: 0.6,
    bluffFreq: 0.45,
    tightness: 0.3,
    lines: lines({
      raise: ["Feelin' lucky — raise!", "Let it ride!", "Why not? Raise."],
      bet: ["I've got a hunch — bet.", "Toss 'em in!", "A little bet for luck."],
      call: ["Sure, I'll call.", "Can't win if you don't play.", "I'm in."],
      check: ["Check it.", "I'll see a free one."],
      fold: ["Eh, fold.", "Saving my luck.", "Next hand's mine."],
      win: ["LUCKY me!", "Clover power!", "Told ya I had a feeling!"],
      bluffCaught: ["Ah, snap.", "Caught red-handed!"],
    }),
  },
  {
    id: "shark",
    name: "Sterling",
    avatar: "🦈",
    aggression: 0.78,
    bluffFreq: 0.28,
    tightness: 0.5,
    lines: lines({
      raise: ["Raise. I smell weakness.", "Applying pressure.", "Let's thin the field."],
      bet: ["Bet. Your move.", "Putting you to a decision.", "Firing the barrel."],
      call: ["I'll call — for now.", "Float.", "Noted. Call."],
      check: ["Check. Trapping?", "I'll check it back."],
      fold: ["Disciplined fold.", "I'll wait for a better spot.", "Released."],
      win: ["Predictable.", "Thank you for the chips.", "Outplayed."],
      bluffCaught: ["Well played, you.", "A worthy call."],
    }),
  },
  {
    id: "river",
    name: "River",
    avatar: "🌊",
    aggression: 0.45,
    bluffFreq: 0.18,
    tightness: 0.7,
    lines: lines({
      raise: ["Quietly raising.", "I'll apply some pressure.", "Raise."],
      bet: ["A measured bet.", "Steady does it.", "I'll bet."],
      call: ["I'll call patiently.", "Flowing along.", "Call."],
      check: ["Check, calm seas.", "I'll wait."],
      fold: ["Folding, no rush.", "Let it drift away.", "Not worth it."],
      win: ["Patience pays.", "The river provides.", "Calm and collected."],
      bluffCaught: ["You read the current.", "Nicely done."],
    }),
  },
];

export function getPersona(id: string): Persona | undefined {
  return PERSONAS.find((p) => p.id === id);
}

export const HOST_PERSONA: Persona =
  PERSONAS.find((p) => p.isHost) ?? PERSONAS[0];

/** Deterministic-ish pick from a quip array. */
export function pickLine(arr: string[]): string {
  if (arr.length === 0) return "";
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Choose `count` personas for a table: the host is always included, the rest
 * are sampled from the remaining personas (no duplicates).
 */
export function pickPersonas(count: number): Persona[] {
  const host = HOST_PERSONA;
  const others = PERSONAS.filter((p) => p.id !== host.id);
  // simple shuffle
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  const chosen = [host, ...others].slice(0, Math.max(1, count));
  return chosen;
}
