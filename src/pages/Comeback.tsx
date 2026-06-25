import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import {
  COMEBACK_QUESTION_COUNT,
  COMEBACK_REWARD,
  REBUY_THRESHOLD,
  drawComebackQuestions,
  isBroke,
  passingScore,
  type ServedQuestion,
} from "../lib/comeback";
import { POKER_ROUTE, tokenBalance } from "../lib/tokens";
import { ComebackQuiz } from "../components/comeback/ComebackQuiz";
import { PhoenixIcon } from "../components/badges/tokenIcons";
import { CheckIcon, XIcon } from "../components/icons";

type Phase = "intro" | "quiz" | "result";

interface AttemptResult {
  correct: number;
  total: number;
  passed: boolean;
  rewarded: boolean;
}

export function Comeback() {
  const { progress, addTokens } = useProgress();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<ServedQuestion[]>([]);
  const [result, setResult] = useState<AttemptResult | null>(null);

  const balance = tokenBalance(progress);
  const broke = isBroke(progress);

  const start = useCallback(() => {
    setQuestions(drawComebackQuestions(COMEBACK_QUESTION_COUNT));
    setResult(null);
    setPhase("quiz");
  }, []);

  const handleComplete = useCallback(
    (correct: number, total: number) => {
      const passed = correct >= passingScore(total);
      // Anti-farm: only ever pay out when the player is actually broke at the
      // moment the challenge is completed.
      const rewarded = passed && isBroke(progress);
      if (rewarded) addTokens(COMEBACK_REWARD);
      setResult({ correct, total, passed, rewarded });
      setPhase("result");
    },
    [addTokens, progress],
  );

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-inner"
            style={{ backgroundImage: "linear-gradient(135deg, #fb7185, #db2777)" }}
          >
            <PhoenixIcon size={24} />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
              Comeback Challenge
            </h1>
            <p className="text-sm text-secondary">
              Bust your stack? Earn a rebuy the hard way.
            </p>
          </div>
        </div>
      </header>

      {phase === "intro" && (
        <IntroCard
          broke={broke}
          balance={balance}
          onStart={start}
          onLeave={() => navigate(POKER_ROUTE)}
        />
      )}

      {phase === "quiz" && questions.length > 0 && (
        <ComebackQuiz questions={questions} onComplete={handleComplete} />
      )}

      {phase === "result" && result && (
        <ResultCard
          result={result}
          balance={balance}
          onRetry={start}
          onToPoker={() => navigate(POKER_ROUTE)}
        />
      )}
    </div>
  );
}

function IntroCard({
  broke,
  balance,
  onStart,
  onLeave,
}: {
  broke: boolean;
  balance: number;
  onStart: () => void;
  onLeave: () => void;
}) {
  return (
    <div className="pp-card p-5 sm:p-6">
      <p className="text-secondary">
        Answer <span className="font-semibold text-primary">{COMEBACK_QUESTION_COUNT}</span>{" "}
        extra-hard probability &amp; poker-math questions. Get at least{" "}
        <span className="font-semibold text-primary">
          {passingScore(COMEBACK_QUESTION_COUNT)}
        </span>{" "}
        right to pass.
      </p>

      <div
        className={[
          "mt-4 rounded-xl border p-4 text-sm",
          broke
            ? "border-accent bg-surface-muted"
            : "border-subtle bg-surface-muted",
        ].join(" ")}
      >
        {broke ? (
          <p className="text-secondary">
            You're down to{" "}
            <span className="font-semibold text-primary">{balance}</span> tokens —
            below the {REBUY_THRESHOLD}-token buy-in for the Beginner's Table. Pass
            the challenge and we'll stake you{" "}
            <span className="font-semibold text-accent">+{COMEBACK_REWARD}</span> tokens
            to get back in the game.
          </p>
        ) : (
          <p className="text-secondary">
            You currently have{" "}
            <span className="font-semibold text-primary">{balance}</span> tokens.
            Rewards are reserved for busted players (under {REBUY_THRESHOLD} tokens),
            but you're welcome to practice these problems any time.
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" className="pp-btn-primary" onClick={onStart}>
          {broke ? "Start the challenge" : "Practice the challenge"}
        </button>
        <button type="button" className="pp-btn-secondary" onClick={onLeave}>
          Back to the tables
        </button>
      </div>
    </div>
  );
}

function ResultCard({
  result,
  balance,
  onRetry,
  onToPoker,
}: {
  result: AttemptResult;
  balance: number;
  onRetry: () => void;
  onToPoker: () => void;
}) {
  const { correct, total, passed, rewarded } = result;

  return (
    <div className="pp-card overflow-hidden">
      <div
        className="flex items-center gap-3 p-5 text-white sm:p-6"
        style={{
          backgroundImage: passed
            ? "linear-gradient(135deg, #34d399, #059669)"
            : "linear-gradient(135deg, #fb7185, #be123c)",
        }}
      >
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
          {passed ? <CheckIcon size={26} /> : <XIcon size={26} />}
        </span>
        <div>
          <h2 className="text-xl font-extrabold">
            {passed ? "You did it!" : "So close!"}
          </h2>
          <p className="text-sm text-white/90">
            You answered {correct} of {total} correctly.
          </p>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {rewarded ? (
          <p className="text-secondary">
            <span className="font-semibold text-accent">+{COMEBACK_REWARD} tokens</span>{" "}
            have been added to your stack (now{" "}
            <span className="font-semibold text-primary">{balance}</span>). Time to
            run it back.
          </p>
        ) : passed ? (
          <p className="text-secondary">
            Nicely done — but rewards are only paid out when you're actually broke
            (under {REBUY_THRESHOLD} tokens). Your balance stands at{" "}
            <span className="font-semibold text-primary">{balance}</span>.
          </p>
        ) : (
          <p className="text-secondary">
            You needed {passingScore(total)} correct to pass. Review the math and
            give it another shot — you've got this.
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {rewarded ? (
            <button type="button" className="pp-btn-primary" onClick={onToPoker}>
              Back to the tables
            </button>
          ) : (
            <button type="button" className="pp-btn-primary" onClick={onRetry}>
              Try again
            </button>
          )}
          {!rewarded && (
            <button type="button" className="pp-btn-secondary" onClick={onToPoker}>
              Back to the tables
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
