"use client";

import { useEffect, useState } from "react";

export function useKeyboard() {
  const [isKeyboardVisible] = useState(false);

  useEffect(() => {
    // Mock keyboard detection
  }, []);

  return { isKeyboardVisible };
}
