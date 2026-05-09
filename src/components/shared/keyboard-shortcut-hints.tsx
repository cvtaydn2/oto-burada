"use client";

export function KeyboardShortcutHints({
  shortcuts,
}: {
  shortcuts: { key: string; description: string }[];
}) {
  if (typeof window === "undefined") return null;

  return (
    <div
      className="hidden lg:flex items-center gap-2 text-xs text-slate-400"
      role="status"
      aria-live="polite"
    >
      {shortcuts.map((s, i) => (
        <span key={i} className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono">{s.key}</kbd>
          <span>{s.description}</span>
        </span>
      ))}
    </div>
  );
}
