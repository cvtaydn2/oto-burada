"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Hydration tamamlanana kadar skeleton göster — flicker önlenir
  if (!mounted) {
    return (
      <div className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-background" />
    );
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
      className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-background transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={resolvedTheme === "light" ? "Karanlık temaya geç" : "Aydınlık temaya geç"}
    >
      {resolvedTheme === "light" ? (
        <Moon className="size-[1.2rem]" />
      ) : (
        <Sun className="size-[1.2rem]" />
      )}
      <span className="sr-only">Temayı değiştir</span>
    </button>
  );
}
