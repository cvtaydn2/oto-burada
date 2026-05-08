# Palette — Accessibility Learning Log

## Reusable Accessibility Patterns
- **Interactive Elements**: Always ensure custom buttons, switches, and clickable cards use semantic HTML (`<button>`, `<a>`) or explicit interactive ARIA roles with appropriate keydown handlers (`space` and `enter`).
- **Screen Reader Labels**: Icon-only buttons must have descriptive `aria-label` tags.
- **Form Controls**: Inputs must always be paired with a `<label htmlFor="...">` matching the input's `id` instead of relying solely on placeholders.
- **Interactive SVG Elements**: When converting SVG paths or visual shapes into interactive elements, always supply `role="button"`, `tabIndex={0}`, and proper `aria-label` tags. Provide a robust `onKeyDown` listener checking for `Enter` or Space (` `) to preserve full keyboard navigability.
- **Toggle Button States**: For filter tabs or toggle selectors, explicitly denote active selection to screen reader software using `aria-pressed={isActive}`.
- **HTML5 Landmarks**: Prefer using semantic wrapping tags such as `<main>` instead of standard generic `<div>` to denote primary layout landmarks.
- **Dynamic Alerts & Warnings**: For components conditionally displaying warnings (like unsupported/skipped parameters), assign `role="status"` and `aria-live="polite"` so screen-reader users receive prompt audio alerts without disruptive focus shifts.
- **Aria-Labels on Icon Buttons**: All custom buttons that render solely visual icons (like `RotateCcw`, `Zap`, `Archive`, `ArrowUpCircle`) require explicit descriptive `aria-label` tags.

## App-Specific UX Learnings
- **Radix UI Dialogs**: Ensure `DialogContent` contains a `DialogTitle` (even if hidden using `sr-only` or Radix `VisuallyHidden`) to avoid browser console errors and maintain keyboard focus bounds.
- **Dynamic Theme Changes**: Keep active states clearly marked with `aria-current` or `aria-selected` for assistive technology.
- **FavoriteButton Tooltip Enhancement**: Composing multiple Radix UI triggers (like TooltipTrigger and PopoverTrigger) requires wrapping them tightly with `asChild` and making sure Providers are moved higher up in the component tree. Placing Context Providers inside an `asChild` element breaks the refs.
