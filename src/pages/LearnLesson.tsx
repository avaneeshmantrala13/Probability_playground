import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { getLearnEntry } from "../content/learn";
import { PrimerFlow } from "../components/lesson/primer/PrimerFlow";
import { ChevronRightIcon } from "../components/icons";

/** Standalone, browsable view of one lesson's concept primer. */
export function LearnLesson() {
  const { lessonId = "" } = useParams();
  const navigate = useNavigate();
  const entry = getLearnEntry(lessonId);

  if (!entry) return <Navigate to="/learn" replace />;
  const { lesson, trackLabel, playerPath } = entry;
  const hasPrimer = (lesson.primer?.length ?? 0) > 0;

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
      </div>

      {hasPrimer ? (
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
