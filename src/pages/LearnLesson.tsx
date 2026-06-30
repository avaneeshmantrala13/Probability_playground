import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { getLearnEntry } from "../content/learn";
import { PrimerFlow } from "../components/lesson/primer/PrimerFlow";
import { NarratedPrimer } from "../components/lesson/primer/NarratedPrimer";
import { useEntitlement, UpsellCard, lessonRequiresPro } from "../lib/billing";
import { ChevronRightIcon } from "../components/icons";

/** Standalone, browsable view of one lesson's concept primer. */
export function LearnLesson() {
  const { lessonId = "" } = useParams();
  const navigate = useNavigate();
  const entry = getLearnEntry(lessonId);
  const { isAtLeast } = useEntitlement();
  const [mode, setMode] = useState<"read" | "watch">("read");

  if (!entry) return <Navigate to="/learn" replace />;
  // Advanced quant primers (lessons 12–18) are Pro-only.
  if (lessonRequiresPro(lessonId) && !isAtLeast("pro")) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-5">
          <Link to="/learn" className="text-sm font-medium text-secondary hover:text-primary">
            &larr; Learn library
          </Link>
        </div>
        <UpsellCard
          feature="all_lessons"
          suggestedPlan="pro"
          title="This primer is part of Pro"
          description="Lessons 12–18 cover advanced quant topics. Upgrade to Pro to read their primers and take the lessons."
        />
      </div>
    );
  }
  const { lesson, trackLabel, playerPath } = entry;
  const hasPrimer = (lesson.primer?.length ?? 0) > 0;
  const hasNarration = (lesson.primerNarration?.length ?? 0) > 0;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link to="/learn" className="text-sm font-medium text-secondary hover:text-primary">
          &larr; Learn library
        </Link>
        <Link to={playerPath} className="text-sm font-semibold text-accent hover:underline">
          Take the lesson
        </Link>
      </div>

      <div className="mb-5">
        <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-secondary">
          {trackLabel} · Lesson {lesson.order}
        </span>
        <h1 className="mt-3 text-2xl font-bold text-primary">{lesson.title}</h1>
        {lesson.subtitle && <p className="mt-1 text-secondary">{lesson.subtitle}</p>}

        {hasNarration && (
          <div className="mt-4 inline-flex rounded-xl border border-subtle bg-surface-muted/40 p-1">
            <button
              type="button"
              onClick={() => setMode("watch")}
              className={[
                "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
                mode === "watch" ? "bg-accent/15 text-accent" : "text-secondary hover:text-primary",
              ].join(" ")}
            >
              Watch concept primer
            </button>
            <button
              type="button"
              onClick={() => setMode("read")}
              className={[
                "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
                mode === "read" ? "bg-accent/15 text-accent" : "text-secondary hover:text-primary",
              ].join(" ")}
            >
              Read primer
            </button>
          </div>
        )}
      </div>

      {mode === "watch" && hasNarration && lesson.primerNarration ? (
        <NarratedPrimer
          slides={lesson.primerNarration}
          closeLabel={hasPrimer ? "Read the primer" : "Done"}
          onClose={() => setMode("read")}
        />
      ) : hasPrimer ? (
        <PrimerFlow
          sections={lesson.primer ?? []}
          ctaLabel="Take the lesson"
          onComplete={() => navigate(playerPath)}
        />
      ) : (
        <div className="pp-card p-6 sm:p-8">
          <div className="space-y-3 leading-relaxed text-secondary">
            {(lesson.intro ?? []).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div className="mt-7">
            <Link to={playerPath} className="pp-btn-primary">
              Take the lesson
              <ChevronRightIcon size={16} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
