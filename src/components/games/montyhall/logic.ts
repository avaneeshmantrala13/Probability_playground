import { randomInt } from "../../simulations/random";

/** What sits behind a door. */
export type Prize = "car" | "goat";

/** The player's decision after the host reveals a goat. */
export type Decision = "switch" | "stay";

export const DOOR_COUNT = 3;
export const DOOR_INDEXES = [0, 1, 2] as const;

/** Result of resolving a single fully-specified Monty Hall round. */
export interface RoundResult {
  carDoor: number;
  firstChoice: number;
  hostOpened: number;
  finalChoice: number;
  decision: Decision;
  won: boolean;
}

/** Place the car uniformly at random behind one of the doors. */
export function placeCar(): number {
  return randomInt(0, DOOR_COUNT - 1);
}

/**
 * The host knows where the car is and always opens a door that is
 * (a) not the player's first pick and (b) hides a goat.
 *
 * If the player's first pick already holds the car, there are two valid goat
 * doors, so the host chooses uniformly between them.
 */
export function hostOpens(carDoor: number, firstChoice: number): number {
  const candidates = DOOR_INDEXES.filter(
    (door) => door !== firstChoice && door !== carDoor,
  );
  if (candidates.length === 1) return candidates[0];
  // Player's pick is the car: pick randomly among the remaining goat doors.
  return candidates[randomInt(0, candidates.length - 1)];
}

/** The unique remaining door a "switch" decision lands on. */
export function switchTarget(firstChoice: number, hostOpened: number): number {
  return DOOR_INDEXES.find(
    (door) => door !== firstChoice && door !== hostOpened,
  ) as number;
}

/** Resolve a complete round once the player's decision is known. */
export function resolveRound(
  carDoor: number,
  firstChoice: number,
  hostOpened: number,
  decision: Decision,
): RoundResult {
  const finalChoice =
    decision === "switch" ? switchTarget(firstChoice, hostOpened) : firstChoice;
  return {
    carDoor,
    firstChoice,
    hostOpened,
    finalChoice,
    decision,
    won: finalChoice === carDoor,
  };
}

/** Simulate one automated round under a fixed strategy and report a win. */
export function simulateRound(decision: Decision): boolean {
  const carDoor = placeCar();
  const firstChoice = randomInt(0, DOOR_COUNT - 1);
  const hostOpened = hostOpens(carDoor, firstChoice);
  return resolveRound(carDoor, firstChoice, hostOpened, decision).won;
}

export interface SimulationOutcome {
  games: number;
  wins: number;
  losses: number;
  winRate: number;
}

/** Run many automated rounds under a fixed strategy. */
export function simulateMany(decision: Decision, games: number): SimulationOutcome {
  let wins = 0;
  for (let i = 0; i < games; i += 1) {
    if (simulateRound(decision)) wins += 1;
  }
  return {
    games,
    wins,
    losses: games - wins,
    winRate: games > 0 ? wins / games : 0,
  };
}

/** The prize behind a given door for a round. */
export function prizeAt(door: number, carDoor: number): Prize {
  return door === carDoor ? "car" : "goat";
}
