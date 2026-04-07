"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  action: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const matchingShortcut = shortcuts.find(
      (shortcut) =>
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        (shortcut.ctrl ? event.ctrlKey || event.metaKey : true) &&
        (shortcut.shift ? event.shiftKey : !event.shiftKey)
    );

    if (matchingShortcut) {
      event.preventDefault();
      matchingShortcut.action();
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

export function KeyboardShortcutHints({ shortcuts }: { shortcuts: { key: string; description: string }[] }) {
  if (typeof window === "undefined") return null;

  return (
    <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400" role="status" aria-live="polite">
      {shortcuts.map((s, i) => (
        <span key={i} className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono">{s.key}</kbd>
          <span>{s.description}</span>
        </span>
      ))}
    </div>
  );
}