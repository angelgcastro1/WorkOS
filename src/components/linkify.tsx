import type { ReactNode } from "react";

// Turns plain note text into text with working links. Handles the three ways a link
// usually gets typed into a note: with a scheme (https://…), with www., or bare
// (cambiocc.com). Email addresses become mailto: links.

const COMMON_TLDS =
  "com|net|org|io|co|ai|app|dev|me|us|uk|ca|design|studio|xyz|edu|gov|info|biz|tv|shop|store|link|site|online|tech|agency|media|photography|works|live|blog";

const PATTERN = new RegExp(
  [
    // email
    "[\\w.+-]+@[\\w-]+\\.[\\w.-]+",
    // scheme or www
    "(?:https?:\\/\\/|www\\.)[^\\s<>()]+",
    // bare domain, optionally with a path
    `[a-z0-9][a-z0-9-]*(?:\\.[a-z0-9-]+)*\\.(?:${COMMON_TLDS})\\b(?:\\/[^\\s<>()]*)?`,
  ].join("|"),
  "gi",
);

/** Punctuation that ends a sentence should not be swallowed into the link. */
function trimTrailing(match: string): { link: string; tail: string } {
  const m = /[.,;:!?)\]]+$/.exec(match);
  if (!m) return { link: match, tail: "" };
  return { link: match.slice(0, m.index), tail: match.slice(m.index) };
}

function hrefFor(value: string): string {
  if (value.includes("@") && !value.includes("/")) return `mailto:${value}`;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

export function Linkify({ text, className }: { text: string; className?: string }): ReactNode {
  const out: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of text.matchAll(PATTERN)) {
    const raw = match[0];
    const start = match.index ?? 0;
    const { link, tail } = trimTrailing(raw);
    if (!link) continue;

    if (start > lastIndex) out.push(text.slice(lastIndex, start));
    out.push(
      <a
        key={key++}
        href={hrefFor(link)}
        target="_blank"
        rel="noopener noreferrer"
        // Stop the click from also hitting whatever the text sits inside.
        onClick={(e) => e.stopPropagation()}
        className={className ?? "text-primary underline underline-offset-2 transition hover:brightness-125"}
      >
        {link}
      </a>,
    );
    if (tail) out.push(tail);
    lastIndex = start + raw.length;
  }

  if (lastIndex < text.length) out.push(text.slice(lastIndex));
  return <>{out}</>;
}
