# Remaining UI/UX Issues - Implementation Guide

These issues were identified but not fully implemented in Phase 37. They are documented here for future implementation.

## 🟣 Issue #26: Accessibility - Missing ARIA Attributes

**Severity:** 🟣 High  
**Status:** 📋 Documented, Not Implemented  
**Files:** Various components in `src/components/`

### Problem
The project includes Playwright a11y tests (`test:a11y`), but custom shadcn/ui components lack proper ARIA attributes:
- Filter drawers missing `aria-label`
- Listing cards missing `aria-describedby`
- Interactive elements missing `role` attributes
- Price information in styled `<div>` instead of semantic HTML

### Recommended Solution

#### 1. Add ARIA Labels to Interactive Elements
```tsx
// Favorite button
<button
  aria-label={`${listing.brand} ${listing.model} ilanını favorilere ekle`}
  aria-pressed={isFavorited}
  onClick={handleFavorite}
>
  <Heart className={isFavorited ? "fill-current" : ""} />
</button>

// Filter drawer
<Sheet>
  <SheetTrigger aria-label="Filtreleri aç">
    <Filter />
  </SheetTrigger>
  <SheetContent aria-labelledby="filter-title">
    <h2 id="filter-title">Filtreler</h2>
    {/* Filter content */}
  </SheetContent>
</Sheet>
```

#### 2. Use Semantic HTML for Price
```tsx
// Before: <div className="text-2xl font-bold">{price}</div>
// After:
<p className="text-2xl font-bold">
  <span className="sr-only">Fiyat:</span>
  <strong>{formatPrice(listing.price)}</strong>
</p>
```

#### 3. Add Descriptive Labels to Cards
```tsx
<article
  aria-labelledby={`listing-${listing.id}-title`}
  aria-describedby={`listing-${listing.id}-details`}
>
  <h3 id={`listing-${listing.id}-title`}>
    {listing.brand} {listing.model}
  </h3>
  <div id={`listing-${listing.id}-details`}>
    {listing.year} • {listing.mileage} km • {listing.city}
  </div>
</article>
```

### Implementation Steps
1. Run `npm run test:a11y` to get baseline violations
2. Fix violations in order of severity (critical → serious → moderate)
3. Add ARIA labels to all interactive elements
4. Use semantic HTML where possible
5. Re-run tests to verify fixes

### Testing
```bash
npm run test:a11y
```

---

## 🟣 Issue #27: Listing Creation - Missing Progress Feedback

**Severity:** 🟣 High  
**Status:** 📋 Documented, Not Implemented  
**Files:** `src/features/listing-creation/`

### Problem
README targets "2 dakika altında ilan oluşturma", but multi-step form lacks granular progress feedback:
- Image upload (magic byte validation + Supabase upload)
- Turnstile token verification
- Moderation notification

Users see generic loading spinner, causing uncertainty and potential form abandonment.

### Recommended Solution

#### Create Progress Component
```tsx
// src/components/forms/upload-progress.tsx
interface UploadStep {
  label: string;
  status: 'pending' | 'loading' | 'complete' | 'error';
}

export function UploadProgress({ steps }: { steps: UploadStep[] }) {
  return (
    <div className="space-y-2">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-2">
          {step.status === 'loading' && <Loader2 className="animate-spin" />}
          {step.status === 'complete' && <CheckCircle className="text-green-500" />}
          {step.status === 'error' && <XCircle className="text-red-500" />}
          {step.status === 'pending' && <Circle className="text-gray-300" />}
          <span className={step.status === 'complete' ? 'text-green-600' : ''}>
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}
```

#### Integrate into Listing Creation
```tsx
const [uploadSteps, setUploadSteps] = useState<UploadStep[]>([
  { label: 'Görseller doğrulanıyor', status: 'pending' },
  { label: 'Yükleniyor (0/5)', status: 'pending' },
  { label: 'İlan oluşturuluyor', status: 'pending' },
  { label: 'Moderasyona gönderiliyor', status: 'pending' },
]);

// Update steps as upload progresses
const handleUpload = async (files: File[]) => {
  // Step 1: Validation
  setUploadSteps(prev => updateStep(prev, 0, 'loading'));
  await validateImages(files);
  setUploadSteps(prev => updateStep(prev, 0, 'complete'));

  // Step 2: Upload
  setUploadSteps(prev => updateStep(prev, 1, 'loading'));
  for (let i = 0; i < files.length; i++) {
    await uploadImage(files[i]);
    setUploadSteps(prev => updateStep(prev, 1, 'loading', `Yükleniyor (${i+1}/${files.length})`));
  }
  setUploadSteps(prev => updateStep(prev, 1, 'complete'));

  // ... continue for other steps
};
```

### Benefits
- Reduces perceived wait time
- Prevents form abandonment
- Builds trust through transparency
- Helps debug upload failures

---

## 🟣 Issue #29: Bottom Sheet (Vaul) - Inconsistent Usage

**Severity:** 🟣 Medium  
**Status:** 📋 Documented, Not Implemented  
**Files:** Various feature components

### Problem
AGENTS.md mandates: "UI via Bottom Sheet: Yeni özellikler ayrı sayfa açmak yerine Vaul drawer içinde başlar"

Vaul is installed but usage is inconsistent:
- Some features use modals
- Some use full pages
- No enforced convention

### Recommended Solution

#### 1. Create Standard Sheet Wrapper
```tsx
// src/components/ui/feature-sheet.tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface FeatureSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}

export function FeatureSheet({ open, onOpenChange, title, children }: FeatureSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh]">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto h-full pb-20">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

#### 2. Add ESLint Rule (Optional)
```js
// .eslintrc.js
rules: {
  'no-restricted-imports': ['error', {
    patterns: [{
      group: ['**/Dialog', '**/Modal'],
      message: 'Use FeatureSheet (Vaul drawer) instead of Dialog/Modal for mobile-first UX'
    }]
  }]
}
```

#### 3. PR Review Checklist
Add to `.github/pull_request_template.md`:
```markdown
- [ ] New features use `<FeatureSheet>` instead of full pages or modals
- [ ] Mobile UX tested with bottom sheet interaction
```

---

## 🟣 Issue #30: Dark Mode - Color Contrast Compliance

**Severity:** 🟣 Low  
**Status:** 📋 Documented, Not Implemented  
**Files:** Tailwind config, theme colors

### Problem
`next-themes` is installed, but some semantic colors may not meet WCAG 2.1 AA contrast ratio (4.5:1) in dark mode:
- `text-muted-foreground`
- `text-gray-500`
- Custom brand colors

### Recommended Solution

#### 1. Audit Current Colors
```bash
# Install contrast checker
npm install --save-dev @adobe/leonardo-contrast-colors

# Create audit script
node scripts/audit-contrast.js
```

#### 2. Test with Storybook
```tsx
// .storybook/preview.tsx
export const decorators = [
  (Story) => (
    <div className="dark">
      <Story />
    </div>
  )
];
```

#### 3. Fix Failing Colors
```ts
// tailwind.config.ts
colors: {
  muted: {
    DEFAULT: "hsl(var(--muted))",
    foreground: "hsl(var(--muted-foreground))", // Ensure 4.5:1 contrast
  },
}

// Update CSS variables in globals.css
.dark {
  --muted-foreground: 215 20.2% 75%; /* Increased from 65% for better contrast */
}
```

#### 4. Add Automated Testing
```tsx
// __tests__/a11y/contrast.test.tsx
import { axe } from 'jest-axe';

test('dark mode meets WCAG AA contrast', async () => {
  const { container } = render(
    <div className="dark">
      <YourComponent />
    </div>
  );
  
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## Implementation Priority

1. **High Priority** (Implement in Phase 38):
   - Issue #26: Accessibility (ARIA attributes)
   - Issue #27: Progress feedback

2. **Medium Priority** (Implement in Phase 39):
   - Issue #29: Bottom sheet consistency

3. **Low Priority** (Implement in Phase 40):
   - Issue #30: Dark mode contrast

---

## Resources

- **Accessibility**: [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- **ARIA**: [MDN ARIA Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- **Vaul**: [Vaul Documentation](https://github.com/emilkowalski/vaul)
- **Contrast**: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

**Date:** April 27, 2026  
**Status:** Documented for future implementation  
**Estimated Effort:** 2-3 days for all issues
