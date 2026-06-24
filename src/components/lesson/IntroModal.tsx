import { useEffect } from "react";
import type { Lesson } from "../../content/types";
import { CloseIcon } from "../icons";

/** Overlay that lets a student re-read a lesson's intro overview at any time. */
export function IntroModal({
  lesson,
  onClose,
}: {
  lesson: Lesson;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="pp-anim-fade-in absolute inset-0 cursor-default bg-bg/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${lesson.title} overview`}
        className="pp-anim-dialog-pop pp-card relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto p-6 sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-secondary">
              Lesson {lesson.order}
            </span>
            <h2 className="mt-3 text-xl font-bold text-primary">{lesson.title}</h2>
            {lesson.subtitle && (
              <p className="mt-1 text-sm text-secondary">{lesson.subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close overview"
            className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-secondary hover:bg-surface-muted hover:text-primary"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="mt-4 space-y-3 leading-relaxed text-secondary">
          {lesson.intro?.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-6">
          <button type="button" className="pp-btn-primary" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
