# Palette — Accessibility Learning Log

## Reusable Accessibility Patterns
- **Interactive Elements**: Always ensure custom buttons, switches, and clickable cards use semantic HTML (`<button>`, `<a>`) or explicit interactive ARIA roles with appropriate keydown handlers (`space` and `enter`).
- **Screen Reader Labels**: Icon-only buttons must have descriptive `aria-label` tags.
- **Form Controls**: Inputs must always be paired with a `<label htmlFor="...">` matching the input's `id` instead of relying solely on placeholders.

## App-Specific UX Learnings
- **Radix UI Dialogs**: Ensure `DialogContent` contains a `DialogTitle` (even if hidden using `sr-only` or Radix `VisuallyHidden`) to avoid browser console errors and maintain keyboard focus bounds.
- **Dynamic Theme Changes**: Keep active states clearly marked with `aria-current` or `aria-selected` for assistive technology.
