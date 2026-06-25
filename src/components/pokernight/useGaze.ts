import { useEffect, useRef, useState } from "react";

/**
 * Per-seat GAZE system for the Poker Night table.
 *
 * Each opponent is given a gaze target that shifts naturally over time and with
 * game events, so players don't constantly stare at the camera. The target maps
 * to a small eye-iris offset (`ex`/`ey`, head-local units) plus an even subtler
 * head lean (`hx`/`hy`); `PlayerSeat` feeds these into the figure.
 *
 * Cheap by design: a single self-rescheduling timeout per seat (varied, non-
 * metronomic intervals, staggered by seat) flips the target between looking at
 * their own cards, the board, a neighbour/the user, or an idle glance. A new
 * community card biases the gaze to the board briefly. Fully inert under reduced
 * motion (neutral gaze, no timers) and when a fixed harness override is set.
 */

export type GazeOverride = "auto" | "cards" | "board" | "player";

export interface GazeOffset {
  /** Eye iris offset, head-local units (clamped to the sclera by the renderer). */
  ex: number;
  ey: number;
  /** Subtle head lean, head-local units. */
  hx: number;
  hy: number;
}

type GazeTarget = "cards" | "board" | "neighborL" | "neighborR" | "user" | "idle";

const NEUTRAL: GazeOffset = { ex: 0, ey: 0, hx: 0, hy: 0 };

/** `side`: -1 for a left-of-centre seat, +1 right, 0 centre. */
function offsetFor(t: GazeTarget, side: number): GazeOffset {
  switch (t) {
    case "cards":
      return { ex: -side * 0.5, ey: 2.2, hx: -side * 0.4, hy: 1.1 };
    case "board":
      return { ex: -side * 1.0, ey: -2.0, hx: -side * 0.8, hy: -0.8 };
    case "neighborL":
      return { ex: -2.0, ey: -0.2, hx: -1.2, hy: 0 };
    case "neighborR":
      return { ex: 2.0, ey: -0.2, hx: 1.2, hy: 0 };
    case "user":
      return { ex: 0, ey: 0.2, hx: 0, hy: 0 };
    case "idle":
    default:
      return {
        ex: (Math.random() * 2 - 1) * 0.9,
        ey: (Math.random() * 2 - 1) * 0.6,
        hx: 0,
        hy: 0,
      };
  }
}

function overrideOffsetFor(o: Exclude<GazeOverride, "auto">, side: number): GazeOffset {
  if (o === "cards") return offsetFor("cards", side);
  if (o === "board") return offsetFor("board", side);
  return offsetFor("user", side); // "player" -> look at the user/camera
}

function pickTarget(talking: boolean): GazeTarget {
  const r = Math.random();
  if (talking) {
    // while speaking, address their cards / the board / a neighbour — never lock
    // a blank stare on the user
    if (r < 0.34) return "cards";
    if (r < 0.64) return "board";
    if (r < 0.82) return "neighborL";
    return "neighborR";
  }
  if (r < 0.26) return "cards";
  if (r < 0.48) return "board";
  if (r < 0.63) return "neighborL";
  if (r < 0.78) return "neighborR";
  if (r < 0.9) return "user";
  return "idle";
}

interface UseGazeArgs {
  seatIndex: number;
  reduced: boolean;
  /** -1 left seat, +1 right seat, 0 centre. */
  side: number;
  /** Community card count; an increase biases the gaze to the board. */
  boardLen: number;
  talking: boolean;
  /** Harness-only: force a fixed gaze target for screenshots. */
  override?: GazeOverride;
}

export function useGaze({
  seatIndex,
  reduced,
  side,
  boardLen,
  talking,
  override = "auto",
}: UseGazeArgs): GazeOffset {
  const [gaze, setGaze] = useState<GazeOffset>(NEUTRAL);
  const talkingRef = useRef(talking);
  talkingRef.current = talking;
  const prevBoard = useRef(boardLen);
  const fixed = override !== "auto";

  // Time-based wandering gaze (disabled under reduced motion / fixed override).
  useEffect(() => {
    if (reduced || fixed) return;
    let cancelled = false;
    let timer = 0;
    const tick = () => {
      if (cancelled) return;
      setGaze(offsetFor(pickTarget(talkingRef.current), side));
      const base = talkingRef.current ? 1500 : 2600;
      timer = window.setTimeout(tick, base + Math.random() * 1900);
    };
    // stagger the first move per seat so they never shift in unison
    timer = window.setTimeout(tick, 300 + (seatIndex % 5) * 540 + Math.random() * 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [reduced, fixed, side, seatIndex]);

  // Event: a freshly dealt community card pulls every gaze to the board briefly.
  useEffect(() => {
    if (reduced || fixed) return;
    if (boardLen > prevBoard.current) setGaze(offsetFor("board", side));
    prevBoard.current = boardLen;
  }, [boardLen, reduced, fixed, side]);

  if (reduced) return NEUTRAL;
  if (fixed) return overrideOffsetFor(override as Exclude<GazeOverride, "auto">, side);
  return gaze;
}
