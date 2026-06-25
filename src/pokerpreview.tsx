/**
 * Poker Night — standalone PREVIEW HARNESS (development only).
 *
 * Committed so the scene can be rendered/screenshotted without the app's login,
 * ProgressContext, or lesson-mastery gating. It mounts the REAL `PokerTable`
 * (and therefore the real Dealer / PlayerSeat / PokerFigure / face / CasinoRoom
 * and the real pokernight.css) with representative MOCK game state — no Firebase,
 * no providers.
 *
 * Served by the existing Vite dev server at:  /pokerpreview.html
 * (Vite serves root-level .html files directly; this is NOT wired into the
 * production build or the gated /poker route.)
 */
import { StrictMode, useEffect, useMemo, useState, type CSSProperties } from "react";
import { createRoot } from "react-dom/client";
import {
  createGame,
  startHand,
  pickPersonas,
  type GameConfig,
  type GameState,
  type Stage,
} from "./lib/poker";
import { getDeckSkin, getTableTheme } from "./lib/cosmetics";
import { PokerTable } from "./components/pokernight/PokerTable";
import type { Expression } from "./components/pokernight/characters";
import type { Speech } from "./components/pokernight/usePokerGame";
import "./index.css";

const CONFIG: GameConfig = {
  smallBlind: 5,
  bigBlind: 10,
  botSkill: 0.7,
  botStack: 1000,
};

const EXPRESSIONS: Expression[] = [
  "idle",
  "think",
  "concerned",
  "smug",
  "happy",
  "sad",
];

/** A few flavored lines to make the speech bubble feel alive. */
const LINES = [
  "I'm all in, friend!",
  "Raise it up.",
  "Hmm… let me think.",
  "I call.",
  "You're bluffing.",
  "Check.",
];

function stageForBoard(n: number): Stage {
  if (n >= 5) return "river";
  if (n === 4) return "turn";
  if (n === 3) return "flop";
  return "preflop";
}

function PokerPreview() {
  const deck = getDeckSkin("deck-classic");
  const theme = getTableTheme("table-classic-green");

  // A full ring: the human (seat 0) + 5 distinct-persona opponents.
  const personas = useMemo(() => pickPersonas(5), []);

  // Real engine-produced state (deals hole cards, posts blinds, builds the deck).
  const [hand, setHand] = useState<GameState>(() =>
    startHand(createGame({ config: CONFIG, humanName: "You", humanStack: 1000, personas })),
  );

  // Harness controls.
  const [boardCount, setBoardCount] = useState(4); // flop + turn revealed by default
  const [expr, setExpr] = useState<Expression>("smug");
  const [speakIdx, setSpeakIdx] = useState(1);
  const [speechText, setSpeechText] = useState(LINES[0]);
  const [speechTick, setSpeechTick] = useState(1);
  const [autoTalk, setAutoTalk] = useState(true);

  // The opponent seat indices (everyone but the human at seat 0).
  const oppIndexes = useMemo(
    () => hand.seats.filter((s) => !s.isHuman).map((s) => s.index),
    [hand.seats],
  );

  // Keep a speech bubble continuously visible (re-push just before it expires) so
  // talking-mouth + expression always render for a screenshot.
  useEffect(() => {
    if (!autoTalk) return;
    const t = window.setInterval(() => setSpeechTick((n) => n + 1), 3000);
    return () => window.clearInterval(t);
  }, [autoTalk]);

  // Compose the view state from the live hand + harness overrides.
  const view = useMemo<GameState>(() => {
    const board = hand.deck.slice(0, boardCount);
    return {
      ...hand,
      board,
      stage: stageForBoard(boardCount),
      pot: 320,
      toAct: speakIdx,
    };
  }, [hand, boardCount, speakIdx]);

  const speeches = useMemo<Record<number, Speech>>(
    () => ({ [speakIdx]: { id: speechTick, text: speechText } }),
    [speakIdx, speechTick, speechText],
  );

  // Apply the chosen expression to every opponent (the human face isn't drawn).
  const expressions = useMemo<Record<number, Expression>>(() => {
    const out: Record<number, Expression> = {};
    hand.seats.forEach((s) => (out[s.index] = s.isHuman ? "idle" : expr));
    return out;
  }, [hand.seats, expr]);

  const newHand = () => {
    setHand((h) => startHand(h)); // bumps handNumber -> dealer shuffle + deal + camera
    setBoardCount(0);
  };
  const revealNext = () => setBoardCount((n) => (n >= 5 ? 0 : n === 0 ? 3 : n + 1));
  const talkNow = () => {
    const idx = oppIndexes[Math.floor(Math.random() * oppIndexes.length)] ?? 1;
    setSpeakIdx(idx);
    setSpeechText(LINES[Math.floor(Math.random() * LINES.length)]);
    setSpeechTick((n) => n + 1);
  };

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: 16, color: "#e5e7eb" }}>
      <h1 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
        Poker Night — Preview Harness{" "}
        <span style={{ opacity: 0.6, fontWeight: 400 }}>(/pokerpreview.html)</span>
      </h1>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <button onClick={newHand} style={btn}>
          New hand (shuffle + deal)
        </button>
        <button onClick={revealNext} style={btn}>
          Reveal next ({boardCount === 0 ? "flop" : boardCount >= 5 ? "reset" : stageForBoard(boardCount + 1)})
        </button>
        <button onClick={talkNow} style={btn}>
          Talk now
        </button>
        <button onClick={() => setAutoTalk((v) => !v)} style={autoTalk ? btnOn : btn}>
          Auto-talk: {autoTalk ? "on" : "off"}
        </button>
        <span style={{ width: 1, background: "#334155", margin: "0 4px" }} />
        {EXPRESSIONS.map((e) => (
          <button
            key={e}
            onClick={() => setExpr(e)}
            style={expr === e ? btnOn : btn}
            data-expr={e}
          >
            {e}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
        Board: {stageForBoard(boardCount)} ({boardCount} cards) · Expression: {expr} ·
        Speaking seat: {speakIdx}
      </div>

      <PokerTable
        state={view}
        deck={deck}
        theme={theme}
        reduced={false}
        speeches={speeches}
        expressions={expressions}
      />
    </div>
  );
}

const btn: CSSProperties = {
  appearance: "none",
  border: "1px solid #334155",
  background: "#111827",
  color: "#e5e7eb",
  borderRadius: 8,
  padding: "6px 10px",
  fontSize: 13,
  cursor: "pointer",
};
const btnOn: CSSProperties = {
  ...btn,
  background: "#2563eb",
  borderColor: "#3b82f6",
  fontWeight: 700,
};

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <PokerPreview />
    </StrictMode>,
  );
}
