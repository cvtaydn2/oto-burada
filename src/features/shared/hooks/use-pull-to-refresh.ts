"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UsePullToRefreshOptions {
  threshold?: number;
  resistance?: number;
  onRefresh: () => Promise<void>;
}

export function usePullToRefresh({
  threshold = 80,
  resistance = 2.5,
  onRefresh,
}: UsePullToRefreshOptions) {
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only trigger if scrolled to top
    if (window.scrollY === 0) {
      startY.current = e.touches[0]?.clientY ?? 0;
      isDragging.current = true;
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging.current) return;

      currentY.current = e.touches[0]?.clientY ?? 0;
      const distance = currentY.current - startY.current;

      if (distance > 0) {
        // Apply resistance
        const adjustedDistance = distance / resistance;
        setPullDistance(Math.min(adjustedDistance, threshold * 1.5));

        // Prevent default scroll if pulling down
        if (distance > 10) {
          e.preventDefault();
        }
      }
    },
    [threshold, resistance]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current) return;

    isDragging.current = false;

    if (pullDistance >= threshold) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }

    setPullDistance(0);
  }, [pullDistance, threshold, onRefresh]);

  useEffect(() => {
    const element = document.body;

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    refreshing,
    pullDistance,
    isActive: pullDistance > 0,
  };
}
