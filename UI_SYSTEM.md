# UI_SYSTEM.md

## Design Intent
The product should feel:
- clean
- calm
- trustworthy
- modern
- easy to scan
- much simpler than generic classifieds websites

This is not a flashy marketplace.
It is a practical, premium-feeling, conversion-oriented product.

---

## Core Principles
1. Trust first
2. Speed first
3. Mobile first
4. Consistency
5. Restraint

---

## Visual Direction
- Background: white or very light neutral
- Text: dark neutral
- Accent: single confident brand color
- Surfaces: white cards on soft neutral background
- Borders: subtle
- Shadows: soft
- Radius: medium to large rounded corners

Avoid:
- heavy gradients
- excessive color usage
- crowded layouts
- tiny text

---

## Typography
Hierarchy:
- H1: hero title
- H2: section titles
- H3: card titles / subsection headers
- Body: default text
- Small: metadata / helper text

Rules:
- readability over density
- price should be visually dominant
- metadata should be compact but legible

---

## Spacing
- generous outer spacing
- comfortable card padding
- 4/8 spacing rhythm
- mobile layout must not feel cramped

---

## Components

### Buttons
Variants:
- primary
- secondary
- ghost
- destructive

Rules:
- primary CTA must stand out
- WhatsApp CTA must be visually distinct
- buttons need hover/focus/disabled states

### Inputs
- large enough for touch
- labels always visible
- helper/error text directly below field
- filter inputs must be easy to scan

### Cards
Use cards for:
- listing previews
- seller info
- trust blocks
- dashboard modules

Listing card priority:
1. image
2. price
3. title
4. year / mileage / fuel / transmission
5. city
6. favorite action

### Badges
Use badges for:
- listing status
- verified seller
- moderation state

---

## Page Guidelines

### Homepage
Sections:
1. Header
2. Hero search block
3. Featured listings
4. Latest listings
5. Trust section
6. Footer

Hero block should include:
- headline
- concise subtext
- brand/model/price/city quick filters
- post listing CTA

### Listings Page
Must support:
- visible results count
- sorting controls
- filter sidebar on desktop
- filter drawer on mobile
- clean listing cards

### Listing Detail Page
Priority:
1. gallery
2. price/title/key facts
3. seller card + WhatsApp CTA
4. description
5. extended specs
6. similar listings

### Create Listing Page
Must feel:
- guided
- simple
- structured
- not overwhelming

Use:
- grouped fields
- clear required/optional labels
- image upload preview
- progress indication if multi-step

### Dashboard
Sections:
- my listings
- favorites
- profile
- status overview

### Admin
Prioritize utility and speed.
Use:
- readable tables/cards
- clear status badges
- obvious moderation actions

---

## States
Every major UI should support:
- default
- loading
- empty
- error
- disabled where needed

Examples:
- listing skeletons
- no result state
- image upload error
- no favorites state

---

## Responsive Rules
Mobile first.

Mobile:
- sticky CTA where useful
- filter drawer instead of fixed sidebar
- large tap targets
- avoid dense multi-column forms

Desktop:
- use width for better scanning
- avoid overly stretched content
- keep form readability high

---

## Trust Signals
The UI should support:
- verified seller badge
- report listing action
- moderation-related cues
- listing completeness hints

---

## Accessibility
- semantic HTML
- visible focus states
- sufficient contrast
- correctly bound labels
- keyboard accessibility

---

## AI UI Prompt
Use this with design AI tools:

Design a startup-grade, mobile-first web UI for a free car classifieds marketplace focused only on automobiles. The product should feel cleaner, safer, more modern, and easier to use than generic classifieds websites. Use a calm, trustworthy, premium-but-approachable aesthetic. Prioritize fast scanning, strong search/filter UX, excellent listing cards, high-quality listing detail pages, and simple listing creation flows. Include homepage, listings search page, listing detail page, create listing page, favorites page, user dashboard, and admin moderation page. Use reusable components, strong typography hierarchy, spacious layouts, large car imagery, clear CTA buttons, rounded cards, subtle shadows, and one confident accent color. Show both desktop and mobile versions with a coherent design system.