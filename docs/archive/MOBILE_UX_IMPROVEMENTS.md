# Mobile UX Improvements - Implementation Guide
**TASK-68: Mobile UX Polish - Code Changes**

This document provides specific code changes and new components to implement the recommendations from the Mobile UX Audit Report.

---

## 1. Fix Touch Target Violations

### 1.1 Update Button Component

**File**: `src/components/ui/button.tsx`

```tsx
// BEFORE
size: {
  default: "h-11 px-6 py-2.5 has-[>svg]:px-4",
  sm: "h-9 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
  lg: "h-12 rounded-md px-8 has-[>svg]:px-6 text-base",
  icon: "size-11 rounded-md",
}

// AFTER - Add responsive sizing for mobile WCAG compliance
size: {
  default: "h-11 px-6 py-2.5 has-[>svg]:px-4",
  sm: "h-11 md:h-9 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5", // 44px on mobile, 36px on desktop
  lg: "h-12 rounded-md px-8 has-[>svg]:px-6 text-base",
  icon: "size-11 rounded-md",
}
```

### 1.2 Update Select Component

**File**: `src/components/ui/select.tsx`

```tsx
// BEFORE
data-[size=default]:h-11 data-[size=sm]:h-8

// AFTER
data-[size=default]:h-11 data-[size=sm]:h-11 md:data-[size=sm]:h-8
```

### 1.3 Fix Share Button in Listing Detail

**File**: `src/app/(public)/(marketplace)/listing/[slug]/page.tsx`

```tsx
// BEFORE (Line ~340)
<ShareButton
  title={listing.title}
  price={listing.price}
  className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3 text-xs font-bold text-muted-foreground transition hover:bg-muted"
/>

// AFTER
<ShareButton
  title={listing.title}
  price={listing.price}
  className="flex h-11 items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3 text-xs font-bold text-muted-foreground transition hover:bg-muted"
/>
```

### 1.4 Standardize Favorite Button

**File**: `src/components/listings/favorite-button.tsx`

```tsx
// Update default className to enforce minimum size
<button
  type="button"
  aria-label={active ? "Favorilerden çıkar" : "Favorilere ekle"}
  aria-pressed={active}
  disabled={!hydrated}
  onClick={handleClick}
  className={cn(
    "flex items-center justify-center rounded-full border border-border/70 bg-background/95 text-foreground shadow-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
    "size-11", // Add default size
    active && "border-primary/30 bg-primary/10 text-primary",
    className
  )}
>
```

---

## 2. Create Reusable Error State Component

**File**: `src/components/shared/error-state.tsx` (NEW)

```tsx
import { AlertCircle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  icon?: React.ElementType;
  iconColor?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  homeLink?: boolean;
  backLink?: boolean;
  className?: string;
}

export function ErrorState({
  title = "Bir Hata Oluştu",
  message = "Beklenmedik bir sorun oluştu. Lütfen tekrar deneyin.",
  icon: Icon = AlertCircle,
  iconColor = "text-rose-600",
  action,
  homeLink = false,
  backLink = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/30">
        <Icon className={cn("size-10", iconColor)} aria-hidden="true" />
      </div>

      {/* Title */}
      <h3 className="mb-3 text-xl font-bold text-foreground tracking-tight">{title}</h3>

      {/* Message */}
      <p className="mb-8 max-w-md text-sm text-muted-foreground leading-relaxed">{message}</p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        {action && (
          <Button onClick={action.onClick} className="flex-1 gap-2" size="lg">
            <RefreshCw className="size-4" />
            {action.label}
          </Button>
        )}

        {backLink && (
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="flex-1 gap-2"
            size="lg"
          >
            <ArrowLeft className="size-4" />
            Geri Dön
          </Button>
        )}

        {homeLink && (
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full gap-2" size="lg">
              <Home className="size-4" />
              Ana Sayfa
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

// Preset variants for common error types
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Bağlantı Hatası"
      message="İnternet bağlantınızı kontrol edin ve tekrar deneyin."
      icon={AlertCircle}
      iconColor="text-amber-600"
      action={
        onRetry
          ? {
              label: "Tekrar Dene",
              onClick: onRetry,
            }
          : undefined
      }
      backLink
    />
  );
}

export function NotFoundError() {
  return (
    <ErrorState
      title="Sayfa Bulunamadı"
      message="Aradığınız sayfa mevcut değil veya taşınmış olabilir."
      icon={AlertCircle}
      iconColor="text-slate-600"
      homeLink
      backLink
    />
  );
}

export function PermissionError() {
  return (
    <ErrorState
      title="Erişim Reddedildi"
      message="Bu sayfayı görüntülemek için yetkiniz bulunmuyor."
      icon={AlertCircle}
      iconColor="text-rose-600"
      homeLink
    />
  );
}
```

---

## 3. Create Reusable Empty State Component

**File**: `src/components/shared/empty-state.tsx` (NEW)

```tsx
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  illustration?: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    href?: string;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    href?: string;
  };
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  illustration,
  primaryAction,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Illustration or Icon */}
      {illustration && (
        <div className="mb-6 size-32 text-muted-foreground/30 animate-in fade-in duration-500">
          {illustration}
        </div>
      )}

      {icon && !illustration && (
        <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-muted/50 text-muted-foreground/50 animate-in fade-in duration-500">
          {icon}
        </div>
      )}

      {/* Title */}
      <h3 className="mb-3 text-xl sm:text-2xl font-bold text-foreground tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="mb-8 max-w-md text-sm text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          {description}
        </p>
      )}

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              className="flex-1"
              size="lg"
              asChild={!!primaryAction.href}
            >
              {primaryAction.href ? (
                <a href={primaryAction.href}>{primaryAction.label}</a>
              ) : (
                primaryAction.label
              )}
            </Button>
          )}

          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              className="flex-1"
              size="lg"
              asChild={!!secondaryAction.href}
            >
              {secondaryAction.href ? (
                <a href={secondaryAction.href}>{secondaryAction.label}</a>
              ) : (
                secondaryAction.label
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 4. Update Existing Empty States

### 4.1 Favorites Page

**File**: `src/components/listings/favorites-page-client.tsx`

```tsx
// BEFORE (around line 93)
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted/50">
    <Heart size={36} className="text-muted-foreground/50" />
  </div>
  <h2 className="text-xl font-bold text-foreground">Henüz favori ilan yok</h2>
  <p className="mt-2 max-w-xs text-sm text-muted-foreground leading-relaxed">
    İlanları gezerken kalp ikonuna tıklayarak buraya ekleyebilirsin.
  </p>
</div>

// AFTER
import { EmptyState } from "@/components/shared/empty-state";

<EmptyState
  title="Henüz Favori İlan Yok"
  description="İlanları gezerken kalp ikonuna tıklayarak buraya ekleyebilirsin. Favorilerin tüm cihazlarda senkronize olur."
  icon={<Heart size={40} />}
  primaryAction={{
    label: "İlanları Keşfet",
    href: "/listings",
  }}
/>
```

### 4.2 My Listings Panel

**File**: `src/components/listings/my-listings-panel.tsx`

```tsx
// BEFORE (around line 205)
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-primary/10">
    <Rocket size={48} />
  </div>
  <h3 className="text-2xl font-bold text-foreground tracking-tight">Henüz İlanınız Yok</h3>
  <p className="mt-3 text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">
    Hayalindeki arabayı satmak ya da yenisini almak için hemen ilk adımını at.
  </p>
</div>

// AFTER
import { EmptyState } from "@/components/shared/empty-state";

<EmptyState
  title="Henüz İlanınız Yok"
  description="Hayalindeki arabayı satmak ya da yenisini almak için hemen ilk adımını at. İlan vermek tamamen ücretsiz!"
  icon={<Rocket size={48} className="text-primary" />}
  primaryAction={{
    label: "Ücretsiz İlan Ver",
    href: "/dashboard/listings/create",
  }}
  secondaryAction={{
    label: "İlanları İncele",
    href: "/listings",
  }}
/>
```

### 4.3 Search Results Empty State

**File**: `src/components/listings/listings-page-client.tsx`

```tsx
// BEFORE (around line 291)
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted/50">
    <Search size={36} className="text-muted-foreground/50" />
  </div>
  <h3 className="mb-2 text-base sm:text-lg font-bold text-foreground tracking-tight">
    Sonuç bulunamadı
  </h3>
  <p className="mb-6 sm:mb-8 max-w-sm text-sm text-muted-foreground">
    Arama kriterlerinizi değiştirerek tekrar deneyin.
  </p>
</div>

// AFTER
import { EmptyState } from "@/components/shared/empty-state";

<EmptyState
  title="Sonuç Bulunamadı"
  description="Arama kriterlerinizi değiştirerek tekrar deneyin veya popüler aramalara göz atın."
  icon={<Search size={40} />}
  primaryAction={{
    label: "Filtreleri Temizle",
    onClick: () => {
      setFilters({ sort: "newest", page: 1, limit: 12 });
    },
  }}
  secondaryAction={{
    label: "Tüm İlanlar",
    href: "/listings",
  }}
/>
```

---

## 5. Add Pull-to-Refresh Hook

**File**: `src/hooks/use-pull-to-refresh.ts` (NEW)

```tsx
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
```

### Usage Example

**File**: `src/components/listings/listings-page-client.tsx`

```tsx
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { RefreshCw } from "lucide-react";

export function ListingsPageClient({ ... }: ListingsPageClientProps) {
  const { refreshing, pullDistance, isActive } = usePullToRefresh({
    threshold: 80,
    onRefresh: async () => {
      await refetch();
    },
  });

  return (
    <div className="relative">
      {/* Pull-to-refresh indicator */}
      {isActive && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-4 bg-background/95 backdrop-blur-sm transition-transform"
          style={{
            transform: `translateY(${Math.min(pullDistance, 80)}px)`,
          }}
        >
          <RefreshCw
            className={cn(
              "size-6 text-primary transition-transform",
              refreshing && "animate-spin",
              pullDistance >= 80 && "rotate-180"
            )}
          />
        </div>
      )}

      {/* Rest of component */}
      {/* ... */}
    </div>
  );
}
```

---

## 6. Add Micro-interactions

### 6.1 Button Press Feedback

**File**: `src/components/ui/button.tsx`

```tsx
// Add to buttonVariants base classes
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-fast ease-standard disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-[0.97]", // Already has active:scale-[0.97] ✅
  // ...
);
```

### 6.2 Favorite Heart Animation

**File**: `src/components/listings/favorite-button.tsx`

```tsx
// Update Heart icon with animation
<Heart
  className={cn(
    "size-4 transition-all duration-300",
    active && "fill-current scale-110" // Add scale on active
  )}
  aria-hidden="true"
/>
```

### 6.3 Ripple Effect Component

**File**: `src/components/ui/ripple.tsx` (NEW)

```tsx
"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

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
```

**Add to**: `src/lib/styles/tw-animate.css`

```css
@keyframes ripple {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(20);
    opacity: 0;
  }
}

.animate-ripple {
  animation: ripple 0.6s ease-out;
}
```

---

## 7. Improve Drawer Interactions

### 7.1 Add Snap Points

**File**: `src/components/layout/mobile-nav.tsx`

```tsx
// BEFORE
<Drawer.Root shouldScaleBackground>

// AFTER - Add snap points for better UX
<Drawer.Root shouldScaleBackground snapPoints={[0.6, 0.85, 1]}>
```

### 7.2 Standardize Drawer Heights

**File**: `src/lib/constants/drawer-heights.ts` (NEW)

```tsx
export const DRAWER_HEIGHTS = {
  sm: "max-h-[40vh]",   // Quick actions, confirmations
  md: "max-h-[60vh]",   // Forms, filters
  lg: "max-h-[85vh]",   // Full content, menus
  full: "h-screen",     // Immersive experiences
} as const;

export type DrawerHeight = keyof typeof DRAWER_HEIGHTS;
```

---

## 8. Add Touch Target Utility

**File**: `src/app/globals.css`

```css
/* Add after existing utilities */

@utility touch-target {
  @apply min-h-[44px] min-w-[44px];
}

@utility touch-target-lg {
  @apply min-h-[48px] min-w-[48px];
}

@utility touch-spacing {
  @apply gap-2; /* Minimum 8px spacing between touch targets */
}
```

---

## 9. Testing Utilities

### 9.1 Touch Target Validator (Development Only)

**File**: `src/lib/dev/touch-target-validator.ts` (NEW)

```tsx
/**
 * Development utility to validate touch targets meet WCAG 2.1 AA standards
 * Only runs in development mode
 */

export function validateTouchTargets() {
  if (process.env.NODE_ENV !== "development") return;

  const MIN_SIZE = 44; // WCAG 2.1 AA minimum
  const WARN_SIZE = 40; // Warning threshold

  const interactiveElements = document.querySelectorAll(
    "button, a, input, select, textarea, [role='button'], [role='link']"
  );

  const violations: Array<{ element: Element; width: number; height: number }> = [];
  const warnings: Array<{ element: Element; width: number; height: number }> = [];

  interactiveElements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    const { width, height } = rect;

    if (width < MIN_SIZE || height < MIN_SIZE) {
      violations.push({ element, width, height });
    } else if (width < WARN_SIZE || height < WARN_SIZE) {
      warnings.push({ element, width, height });
    }
  });

  if (violations.length > 0) {
    console.error(
      `❌ WCAG Violation: ${violations.length} touch targets below 44px minimum:`,
      violations
    );
  }

  if (warnings.length > 0) {
    console.warn(
      `⚠️ Warning: ${warnings.length} touch targets below 40px (consider increasing):`,
      warnings
    );
  }

  if (violations.length === 0 && warnings.length === 0) {
    console.log("✅ All touch targets meet WCAG 2.1 AA standards");
  }
}

// Auto-run on page load in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  window.addEventListener("load", () => {
    setTimeout(validateTouchTargets, 1000);
  });
}
```

---

## 10. Implementation Checklist

### Phase 1: Critical Fixes (Day 1)
- [ ] Update button component with responsive sizing
- [ ] Update select component with responsive sizing
- [ ] Fix share button touch target
- [ ] Standardize favorite button size
- [ ] Create `<ErrorState />` component
- [ ] Create `<EmptyState />` component
- [ ] Update favorites page empty state
- [ ] Update my listings empty state
- [ ] Update search results empty state

### Phase 2: UX Enhancements (Day 2-3)
- [ ] Create pull-to-refresh hook
- [ ] Implement pull-to-refresh on listings page
- [ ] Add favorite heart animation
- [ ] Add ripple effect component
- [ ] Standardize drawer heights
- [ ] Add drawer snap points
- [ ] Add touch target utility classes

### Phase 3: Testing & Validation (Day 4)
- [ ] Run touch target validator
- [ ] Test on real iOS device
- [ ] Test on real Android device
- [ ] Run Lighthouse mobile audit
- [ ] Run axe accessibility audit
- [ ] Fix any remaining issues

---

## 11. Testing Commands

```bash
# Run Lighthouse audit
npm run lighthouse:mobile

# Run accessibility audit
npm run a11y:audit

# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build
```

---

## 12. Success Metrics

After implementing these changes, you should achieve:

- ✅ **100% WCAG Touch Target Compliance** (all interactive elements ≥ 44px)
- ✅ **Lighthouse Mobile Score**: 95+
- ✅ **Accessibility Score**: 95+
- ✅ **0 axe violations**
- ✅ **Smooth 60fps animations**
- ✅ **Engaging empty/error states**

---

**Next Steps**: 
1. Review this implementation guide
2. Prioritize Phase 1 critical fixes
3. Test on real devices
4. Iterate based on user feedback
