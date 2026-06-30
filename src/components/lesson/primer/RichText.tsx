import { Fragment, type ReactNode } from "react";

/**
 * Minimal, dependency-free inline renderer for primer/narration copy. Supports:
 *  - **bold**
 *  - `code`
 *  - inline math written as \( … \) or $ … $ (rendered in a serif italic style)
 *
 * It intentionally avoids dangerouslySetInnerHTML: every span is a real React
 * node, so authored content can never inject markup.
 */

// Order matters: math first (so a `$` inside other text is handled), then bold,
// then code. Each alternative captures its inner content in a group.
const TOKEN =
  /\\\((.+?)\\\)|\$(.+?)\$|\*\*(.+?)\*\*|`(.+?)`/g;

function MathSpan({ children }: { children: ReactNode }) {
  return (
    <span className="whitespace-nowrap font-serif text-[1.02em] italic text-primary">
      {children}
    </span>
  );
}

export function RichText({ text }: { text: string }): JSX.Element {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of text.matchAll(TOKEN)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      nodes.push(<Fragment key={key++}>{text.slice(lastIndex, start)}</Fragment>);
    }
    const [, math1, math2, bold, code] = match;
    if (math1 != null) {
      nodes.push(<MathSpan key={key++}>{math1}</MathSpan>);
    } else if (math2 != null) {
      nodes.push(<MathSpan key={key++}>{math2}</MathSpan>);
    } else if (bold != null) {
      nodes.push(
        <strong key={key++} className="font-semibold text-primary">
          {bold}
        </strong>,
      );
    } else if (code != null) {
      nodes.push(
        <code
          key={key++}
          className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[0.85em] text-primary"
        >
          {code}
        </code>,
      );
    }
    lastIndex = start + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }

  return <>{nodes}</>;
}
