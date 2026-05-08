## 2025-02-12 - FavoriteButton Tooltip Enhancement
**Learning:** Composing multiple Radix UI triggers (like TooltipTrigger and PopoverTrigger) requires wrapping them tightly with `asChild` and making sure Providers are moved higher up in the component tree. Placing Context Providers inside an `asChild` element breaks the refs.
**Action:** Always check the Radix UI documentation for composition when combining Popovers and Tooltips on the same trigger element.

## 2026-05-08 - WCAG AA & Accessibility Pass
**Learnings & Actionable Patterns:**
1. **Interactive SVG Elements:** When converting SVG paths or visual shapes into interactive elements, always supply `role="button"`, `tabIndex={0}`, and proper `aria-label` tags. Provide a robust `onKeyDown` listener checking for `Enter` or Space (` `) to preserve full keyboard navigability.
2. **Toggle Button States:** For filter tabs or toggle selectors, explicitly denote active selection to screen reader software using `aria-pressed={isActive}`.
3. **HTML5 Landmarks:** Prefer using semantic wrapping tags such as `<main>` instead of standard generic `<div>` to denote primary layout landmarks.
4. **Dynamic Alerts & Warnings:** For components conditionally displaying warnings (like unsupported/skipped parameters), assign `role="status"` and `aria-live="polite"` so screen-reader users receive prompt audio alerts without disruptive focus shifts.
5. **Aria-Labels on Icon Buttons:** All custom buttons that render solely visual icons (like `RotateCcw`, `Zap`, `Archive`, `ArrowUpCircle`) require explicit descriptive `aria-label` tags.
