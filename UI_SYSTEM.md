# UI_SYSTEM.md

## Design Intent
The product should feel:
- clean and calm (lightweight classified marketplace)
- trustworthy and safe
- modern yet approachable
- fast to scan on mobile
- simpler than generic classifieds websites (Sahibinden, Arabam.com)

This is NOT a flashy showroom or dealership site.
It is a practical, premium-feeling, conversion-oriented car marketplace.

---

## Core Principles
1. Trust first
2. Speed first
3. Mobile first
4. Consistency
5. Restraint — avoid visual noise

---

## Visual Direction

### Color Palette
- Background: white or very light neutral (`#F8FAFC`)
- Surface: white cards (`#FFFFFF`)
- Border: subtle slate (`#E2E8F0`)
- Text primary: dark slate (`#0F172A`)
- Text secondary: medium slate (`#64748B`)
- Accent/Primary: confident brand color (use CSS variable `--primary`)
- Success: emerald (`#10B981`)
- Warning: amber (`#F59E0B`)
- Danger: red (`#EF4444`)
- WhatsApp: `#25D366`

Avoid:
- heavy gradients on backgrounds
- glassmorphism effects in non-hero areas
- dark slate hero backgrounds (trust signals should use white/light)
- excessive color usage beyond primary + status colors

### Typography
- Heading font: bold, dark neutral, uppercase for labels
- Body: readable, comfortable line height
- Price: visually dominant, bold, primary color
- Metadata: compact but legible (small text, muted color)
- Turkish content with proper locale formatting (Intl.NumberFormat)

### Spacing
- Card padding: comfortable (p-6 to p-8)
- Section gaps: generous (gap-6 to gap-8)
- Mobile: no cramped layouts
- Border radius: rounded-xl to rounded-2xl

### Component Style
- White cards on soft neutral background
- Subtle borders (1px slate-200)
- Soft shadows (shadow-sm to shadow-xl)
- No heavy gradients outside hero

---

## Page Guidelines

### Homepage (`/`)
Hero block:
- Headline: "Hayalindeki Aracı Bugün Bul" (or dynamic SEO H1)
- Subtext: concise, trust-oriented
- Search form: brand/model input, city select, price range, search button
- Post listing CTA: prominent
- Popular brand chips below search
Trust section:
- Use white cards on light background
- NOT dark slate with glassmorphism

### Listings Page (`/listings`)
- Results count visible
- Sort controls (dropdown)
- Filter sidebar on desktop
- Filter drawer on mobile (bottom sheet)
- Grid/list view toggle
- Clean listing cards

### Listing Detail Page (`/listing/[slug]`)
Priority order:
1. Image gallery with badges
2. Price + title + key facts
3. Seller card + WhatsApp CTA + Message Seller button
4. Key specs grid (year/km/fuel/transmission)
5. Expert inspection section (if available)
6. Market analysis section (market price comparison)
7. Description
8. Similar listings

Sidebar (right column, sticky on desktop):
- Seller information card
- Contact actions (WhatsApp, Message, Phone reveal)
- Quick offer card (optional, non-intrusive)
- Security tips card
- Report listing button

### Create Listing Page (`/dashboard/listings/new`)
3-step wizard:
1. Araç Bilgileri (brand/model/trim/year)
2. Detaylar (mileage/fuel/transmission/price/city/district/description)
3. Fotoğraflar (minimum 3, drag to reorder)

Rules:
- Progress indicator
- Clear required/optional labels
- Image upload preview with compression feedback
- Mobile-friendly form

### Favorites Page (`/favorites`)
- Clean listing grid
- Empty state: "Henüz favori ilan eklemedin"
- Remove from favorites action

### Dashboard
Sections:
- İlanlarım (my listings with status badges)
- Favoriler (favorites)
- Profil (profile form)
- Mesajlar (chat)
- Fiyatlandırma (optional: paid bumps)

### Admin Panel
- Overview dashboard with metrics
- Pending listings moderation
- Reports review
- User management
- Role/permission management
- Audit logs
- Analytics

### Support / Ticket System (`/support`)
- FAQ categories
- Ticket submission form
- Ticket list view (for user)
- Admin ticket management

---

## Component Standards

### Buttons
Variants: primary, secondary, ghost, destructive, WhatsApp
Rules:
- WhatsApp CTA: green (#25D366) background, white text
- Primary CTA: primary color, prominent
- Hover/focus/disabled states required

### Inputs
- Large touch targets (min 44px)
- Always-visible labels
- Error messages below field
- Helper text where needed

### Cards
- White background, subtle border
- Rounded corners (rounded-xl)
- Comfortable padding (p-6)
- Shadow on hover (optional)

### Listing Card Priority
1. Image (primary photo)
2. Price (bold, primary)
3. Title (brand + model + trim)
4. Specs: year • km • fuel • transmission
5. City
6. Favorite action (heart icon)

### Badges
- Status badges (approved/pending/rejected/archived)
- Verified badge (e-posta doğrulaması)
- Expert inspection badge
- Fuel type / transmission badges

### States
Every UI must handle:
- loading (skeleton)
- empty (friendly message)
- error (error message)
- disabled (muted appearance)

---

## Trust Signals
- Verified seller badge
- Expert inspection badge
- Report listing action
- Security tips section
- View counter
- Moderation status indicators

---

## Accessibility
- semantic HTML
- visible focus states
- sufficient contrast ratios
- correctly bound labels
- keyboard navigation
- touch targets min 44px
- aria labels on icon buttons

---

## AI UI Prompt
Use this with design AI tools:

Design a startup-grade, mobile-first web UI for a free car classifieds marketplace focused only on automobiles. The product should feel cleaner, safer, more modern, and easier to use than generic classifieds websites (Sahibinden, Arabam.com). Use a calm, trustworthy, premium-but-approachable aesthetic. Light color palette with white cards on soft neutral background. Prioritize fast scanning, strong search/filter UX, excellent listing cards, high-quality listing detail pages, and simple listing creation flows. Include homepage, listings search page, listing detail page, create listing page, favorites page, user dashboard, and admin moderation page. Use reusable components, strong typography hierarchy, spacious layouts, large car imagery, clear CTA buttons, rounded cards, subtle shadows, and one confident accent color. Show both desktop and mobile versions with a coherent design system. Include support/ticket system pages.

---

## UI Copy Reference

### Homepage Hero
- Başlık: "Arabanı kolayca sat"
- Alt metin: "Ücretsiz ilan ver, doğru alıcıya hızlıca ulaş."
- CTA: "İlan Ver"

### Search
- Placeholder: "Marka, model ara..."
- Filters: Marka, Model, Fiyat, Şehir, KM

### Listing Detail Buttons
- "WhatsApp ile İletişime Geç"
- "Favorilere Ekle"
- "Şikayet Et"

### Create Listing
- Title: "İlan Oluştur"
- Steps: "Araç Bilgileri" → "Detaylar" → "Fotoğraflar"
- Submit: "İlanı Yayına Gönder"

### Form Labels
Başlık, Marka, Model, Yıl, Kilometre, Yakıt Tipi, Vites, Fiyat, Şehir, İlçe, Açıklama

### Validation Messages
- "Bu alan zorunlu"
- "En az 3 fotoğraf eklemelisin"
- "Geçerli bir değer gir"

### Status Labels
- Yayında, İnceleniyor, Reddedildi, Arşivlendi

### Toast Messages
- Success: "İşlem başarılı"
- Error: "Bir hata oluştu"

### WhatsApp Template
"Merhaba, ilanınızla ilgileniyorum."

### Report Reasons
Sahte ilan, Yanlış bilgi, Spam, Diğer

### Admin Actions
Onayla, Reddet, İncele
