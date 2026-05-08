"use client";

import { useCallback, useState } from "react";

import { cn } from "@/lib";

interface RippleProps {
  children: React.ReactNode;
  className?: string;
}

export function Ripple({ children, className }: RippleProps) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const addRipple = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, 600);
  }, []);

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onMouseDown={addRipple}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        if (touch) {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = touch.clientX - rect.left;
          const y = touch.clientY - rect.top;
          const id = Date.now();
          setRipples((prev) => [...prev, { x, y, id }]);
          setTimeout(() => {
            setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
          }, 600);
        }
      }}
    >
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute size-2 rounded-full bg-primary/20 animate-ripple pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </div>
  );
}
