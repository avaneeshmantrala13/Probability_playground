import { Link } from "react-router-dom";
import { learnGroups } from "../content/learn";
import { BookIcon, ChevronRightIcon, LibraryIcon } from "../components/icons";

/**
 * The Learn / Articles library: a browsable index of every lesson's concept
 * primer, grouped by track, so learners can study the material independently of
 * taking the quiz.
 */
export function Learn() {
  const groups = learnGroups();

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-500">
            <LibraryIcon size={24} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-primary">Learn</h1>
            <p className="text-secondary">
              Concept primers for every lesson — read the interview-grade theory,
              terms, and worked examples before you drill.
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-10">
        {groups.map((group) => (
          <section key={group.track}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-secondary">
              {group.trackLabel}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {group.entries.map(({ lesson }) => {
                const hasRichPrimer = (lesson.primer?.length ?? 0) > 0;
                return (
                  <Link
                    key={lesson.lessonId}
                    to={`/learn/${lesson.lessonId}`}
                    className="pp-card group flex items-start gap-3 p-4 transition-colors hover:border-accent/50"
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-secondary group-hover:text-accent">
                      <BookIcon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-semibold text-primary">
                          {lesson.title}
                        </span>
                        {hasRichPrimer && (
                          <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                            Primer
                          </span>
                        )}
                      </span>
                      {lesson.subtitle && (
                        <span className="mt-0.5 block truncate text-sm text-secondary">
                          {lesson.subtitle}
                        </span>
                      )}
                    </span>
                    <ChevronRightIcon
                      size={18}
                      className="mt-1 shrink-0 text-muted group-hover:text-accent"
                    />
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
