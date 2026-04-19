"use client";

import { useEffect, useCallback } from "react";

type KeyboardEventHandler = (event: KeyboardEvent) => void;

interface UseKeyboardOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onKeyDown?: KeyboardEventHandler;
  enabled?: boolean;
}

export function useKeyboard({ onEscape, onEnter, onKeyDown, enabled = true }: UseKeyboardOptions) {
  const handleKeyDown = useCallback<KeyboardEventHandler>(
    (event) => {
      if (!enabled) return;

      if (event.key === "Escape" && onEscape) {
        event.preventDefault();
        onEscape();
      }

      if (event.key === "Enter" && onEnter) {
        event.preventDefault();
        onEnter();
      }

      if (onKeyDown) {
        onKeyDown(event);
      }
    },
    [enabled, onEscape, onEnter, onKeyDown]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, enabled]);
}

interface UseClickOutsideOptions {
  onClickOutside: () => void;
  enabled?: boolean;
}

export function useClickOutside({
  onClickOutside,
  enabled = true,
}: UseClickOutsideOptions) {
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