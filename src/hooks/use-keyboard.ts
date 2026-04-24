"use client";

import { useCallback, useEffect } from "react";

type KeyboardEventHandler = (event: KeyboardEvent) => void;

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  action: () => void;
  description?: string;
}

interface UseKeyboardOptions {
  shortcuts?: KeyboardShortcut[];
  onEscape?: () => void;
  onEnter?: () => void;
  onKeyDown?: KeyboardEventHandler;
  enabled?: boolean;
}

export function useKeyboard({
  shortcuts = [],
  onEscape,
  onEnter,
  onKeyDown,
  enabled = true,
}: UseKeyboardOptions) {
  const handleKeyDown = useCallback<KeyboardEventHandler>(
    (event) => {
      if (!enabled) return;

      // Handle specific keys
      if (event.key === "Escape" && onEscape) {
        event.preventDefault();
        onEscape();
        return;
      }

      if (event.key === "Enter" && onEnter) {
        event.preventDefault();
        onEnter();
        return;
      }

      // Handle shortcuts
      if (shortcuts.length > 0) {
        const key = event.key;
        const matchingShortcut = shortcuts.find(
          (shortcut) =>
            shortcut.key.toLowerCase() === key.toLowerCase() &&
            (shortcut.ctrl ? event.ctrlKey || event.metaKey : true) &&
            (shortcut.shift ? event.shiftKey : !event.shiftKey)
        );

        if (matchingShortcut) {
          event.preventDefault();
          matchingShortcut.action();
          return;
        }
      }

      // Handle generic keydown
      if (onKeyDown) {
        onKeyDown(event);
      }
    },
    [enabled, onEscape, onEnter, onKeyDown, shortcuts]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, enabled]);
}

interface UseClickOutsideOptions {
  onClickOutside: () => void;
  enabled?: boolean;
}

export function useClickOutside({ onClickOutside, enabled = true }: UseClickOutsideOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest(".prevent-click-outside")) return;
      onClickOutside();
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClickOutside, enabled]);
}
