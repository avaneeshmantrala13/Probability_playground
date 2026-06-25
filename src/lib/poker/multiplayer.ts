import { startHand } from "./engine";
import type { GameConfig, GameState, Seat } from "./types";
import { pickPersonas } from "./personalities";
import type { Persona } from "./types";
import { MAX_PLAYERS } from "../multiplayer/constants";

export interface MultiplayerHuman {
  seatIndex: number;
  name: string;
  stack: number;
}

function makeSeat(
  index: number,
  name: string,
  isHuman: boolean,
  stack: number,
  persona?: Persona,
): Seat {
  return {
    index,
    name,
    isHuman,
    persona,
    stack,
    holeCards: [],
    roundBet: 0,
    committed: 0,
    status: stack > 0 ? "active" : "out",
    hasActed: false,
  };
}

/** Build a multiplayer table: humans at assigned seats, bots fill empties up to 6. */
export function createMultiplayerGame(
  config: GameConfig,
  humans: MultiplayerHuman[],
): GameState {
  const botSlots = Math.max(0, MAX_PLAYERS - humans.length);
  const personas = pickPersonas(botSlots);
  let personaIdx = 0;
  const seats: Seat[] = [];

  for (let i = 0; i < MAX_PLAYERS; i++) {
    const human = humans.find((h) => h.seatIndex === i);
    if (human) {
      seats.push(makeSeat(i, human.name, true, human.stack));
    } else if (personaIdx < personas.length) {
      seats.push(makeSeat(i, personas[personaIdx].name, false, config.botStack, personas[personaIdx]));
      personaIdx++;
    }
  }

  const base: GameState = {
    seats,
    config,
    button: 0,
    board: [],
    deck: [],
    stage: "complete",
    currentBet: 0,
    minRaise: config.bigBlind,
    toAct: null,
    lastAggressor: null,
    pot: 0,
    handNumber: 0,
    result: null,
    log: [],
  };

  return startHand(base);
}
