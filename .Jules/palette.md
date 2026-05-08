## 2025-02-12 - FavoriteButton Tooltip Enhancement
**Learning:** Composing multiple Radix UI triggers (like TooltipTrigger and PopoverTrigger) requires wrapping them tightly with `asChild` and making sure Providers are moved higher up in the component tree. Placing Context Providers inside an `asChild` element breaks the refs.
**Action:** Always check the Radix UI documentation for composition when combining Popovers and Tooltips on the same trigger element.
