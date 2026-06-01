# FRONTEND_DIRECTIVE.md
**Placement ERP — Frontend Engineering Directive**
*Account 1 · Senior Frontend Engineer · impeccable.style standard*
*Next.js 14 App Router · TypeScript Strict · Tailwind CSS*

> This document is law. Every component, every route, every state decision is governed by what is written here. When in doubt, refer back. When you disagree, document why — but the default answer is: follow the directive.

---

## Table of Contents

1. [The Anti-Slop Rulebook](#1-the-anti-slop-rulebook)
2. [Design Identity & Token System](#2-design-identity--token-system)
3. [Typography System](#3-typography-system)
4. [Color System](#4-color-system)
5. [Spacing & Layout Grid](#5-spacing--layout-grid)
6. [Motion & Animation](#6-motion--animation)
7. [Component Design Guidelines](#7-component-design-guidelines)
8. [Routing Architecture](#8-routing-architecture)
9. [State Management](#9-state-management)
10. [Pagination](#10-pagination)
11. [Modularity & Component Composition](#11-modularity--component-composition)
12. [Performance — Memoization & Re-render Prevention](#12-performance--memoization--re-render-prevention)
13. [Memory Leak Prevention](#13-memory-leak-prevention)
14. [Frontend Security](#14-frontend-security)
15. [Accessibility](#15-accessibility)
16. [Error States, Empty States & Loading](#16-error-states-empty-states--loading)
17. [Component Checklist](#17-component-checklist)

---

## 1. The Anti-Slop Rulebook

Source: impeccable.style/slop — 46 patterns that mark an interface as AI-generated. Every rule here is a **hard ban**. There are no exceptions.

### 1.1 Visual Details — Banned Patterns

```
❌ NEVER: Thick colored border on one side of a rounded card (side-tab accent)
         The single most recognizable tell of AI-generated UI.
         If you find border-l-4 border-accent on a rounded card, delete it.

❌ NEVER: Glassmorphism as decoration
         backdrop-blur + bg-white/10 + border border-white/20 as a visual style.
         Frosted glass solves a real layering problem or it ships plain.

❌ NEVER: Hairline border (border) paired with wide diffuse shadow (shadow-xl)
         Pick one: a defined edge OR soft elevation. Not both.

❌ NEVER: Extreme border-radius on cards (>16px on a card element)
         rounded-3xl on a data card rounds it into a blob. 
         Cards: rounded-xl (12px) max. Buttons/pills: rounded-full is fine.
         
❌ NEVER: Repeating gradient stripes as surface decoration
         background: repeating-linear-gradient(...) on content areas.
```

### 1.2 Typography — Banned Patterns

```
❌ NEVER: Inter, Roboto, Geist, Space Grotesk, Open Sans as the primary typeface
         These are invisible defaults. They feel like no decision was made.
         This project uses Cabinet Grotesk (display) + DM Sans (body).

❌ NEVER: One font family for the entire app
         Headings and body must come from different families.
         No typographic hierarchy = no design.

❌ NEVER: Flat type scale (all sizes within 4px of each other)
         Must have at least 1.333x ratio between type scale steps.

❌ NEVER: Icon tile above heading (small rounded-square container above h2/h3)
         This is the universal AI feature-card template. Every generator outputs it.
         Use side-by-side icon + heading, or let the icon sit in flow without a container.

❌ NEVER: Hero eyebrow pill chip (tiny uppercase tracked label above hero headline)
         "Introducing · The Placement ERP" — this pattern is exhausted.
         If you need a kicker, fold it into the headline.

❌ NEVER: Oversized hero headline with full sentence
         A complete sentence at display size: wrong. 
         Long headlines must be set smaller; save display size for 1-4 word phrases.

❌ NEVER: Italic serif display as primary headline
         Oversized italic serif = default AI startup landing page hero.
         Dashboard app register: always set roman.

❌ NEVER: Letter spacing below -0.04em (destructive tightening)
         Tight display type is optical, not destructive.

❌ NEVER: Letter spacing above 0.05em on body text
         Reserve wide tracking for short uppercase labels only (tracking-widest on labels).

❌ NEVER: All-caps body text or paragraphs
         Reserve uppercase for 2-4 word labels (status badges, section labels).

❌ NEVER: Justified text
         text-justify creates rivers of whitespace. Always text-left for body content.
```

### 1.3 Color & Contrast — Banned Patterns

```
❌ NEVER: Purple/violet to blue gradient as the primary palette
         bg-gradient-to-r from-purple-600 to-blue-500 — the most recognized AI tell.
         This project's accent is #4F7CFF (intentional, not gradient).

❌ NEVER: Gradient text on headings or metrics
         bg-clip-text text-transparent bg-gradient-to-r = decoration over meaning.
         Text is solid. Always.

❌ NEVER: Dark backgrounds with glowing box-shadow accents
         shadow-[0_0_20px_rgba(79,124,255,0.8)] — cyberpunk-by-default slop.
         Max glow: shadow-[0_0_20px_rgba(79,124,255,0.2)] — barely perceptible.

❌ NEVER: Cream/beige page backgrounds chosen "because it looks tasteful"
         bg-amber-50, bg-stone-50, bg-neutral-50 as a surface color.
         This project uses #0F1117 (surface) as the base — every decision is intentional.

❌ NEVER: Gray text on a colored background
         text-gray-400 on bg-accent — washed out, low contrast.
         Use text-ink-muted on surface backgrounds only.
```

### 1.4 Layout & Space — Banned Patterns

```
❌ NEVER: Cards inside cards inside cards (Cardocalypse)
         If nesting exceeds 2 levels, flatten the hierarchy.
         Use spacing, typography, and dividers instead of nested containers.

❌ NEVER: The same spacing value everywhere (monotonous spacing)
         gap-4 everywhere, p-4 everywhere. No rhythm.
         Related items: tight groupings. Sections: generous separation.

❌ NEVER: Numbered section markers (01 / 02 / 03) as decoration
         Not a sequence = no numbers. Only use when content is literally ordered.

❌ NEVER: Identical card grids (same size, same icon+heading+text, repeated 6 times)
         Vary sizing. Lead with the most important, scale others.

❌ NEVER: Hero metric layout (big number, small label, 3 supporting stats, gradient accent)
         The default AI dashboard template. Use data tables, funnel visualizations instead.

❌ NEVER: Text lines wider than 80ch
         All prose, descriptions, and form labels: max-w-prose (65ch).
         Dashboard data tables are exempt.

❌ NEVER: Body text touching viewport edge with no padding
         Minimum 16px horizontal container padding on all viewports.
```

### 1.5 Motion — Banned Patterns

```
❌ NEVER: Bounce or elastic easing on UI elements
         ease-[cubic-bezier(0.34,1.56,0.64,1)] on modals, cards, drawers.
         Reserve spring physics for physically thrown or dragged elements only.
         Interface motion: always ease-out (quart, quint, expo).

❌ NEVER: Animating width, height, padding, or margin
         These cause layout thrash and janky 30fps animations.
         Use transform + opacity. For height reveals: grid-template-rows.

❌ NEVER: Image scale on hover as a general pattern
         transform: scale(1.05) on every card image = AI signature.
         Hover states are interaction affordances, not decoration.
```

### 1.6 Copy — Banned Patterns

```
❌ NEVER: Em-dash overuse in UI text
         "Manage drives — track students — generate reports" = AI cadence.
         Use commas or colons. Em-dash is for genuine asides, once per paragraph.

❌ NEVER: Marketing buzzwords in product UI
         "Supercharge your workflow", "Streamline placements", "Empower students"
         Say what it literally does: "Add a drive", "Track stage", "Export report".

❌ NEVER: Aphoristic manufactured-contrast copy
         "Not a tool. A platform." This pattern is exhausted.
```

---

## 2. Design Identity & Token System

### 2.1 Register: Product (not Brand)

This is a **Product register** — a tool where design serves function. Rules:
- Typography: fixed rem scales, not fluid clamp (that's for marketing pages)
- Motion: functional, fast, purposeful. Never cinematic.
- Density: data-forward. Pack information efficiently without cramming.
- Color: status-driven. Colors carry meaning, not decoration.

### 2.2 Token Reference

Establish these in `tailwind.config.ts` AND as CSS custom properties. Both. Tailwind utilities for components; CSS vars for dynamic theming and design consistency.

```css
/* src/app/globals.css — CSS Custom Properties (source of truth) */
:root {
  /* === SURFACES === */
  --surface-base:   #0F1117;   /* page background */
  --surface-50:     #1C1F2A;   /* elevated surface (cards) */
  --surface-100:    #252838;   /* further elevation (modals, dropdowns) */
  --surface-200:    #2E3244;   /* highest elevation (tooltips, popovers) */

  /* === BORDERS === */
  --border-default: #2A2D3A;   /* standard border */
  --border-strong:  #3D4155;   /* emphasis border, focus rings base */
  --border-accent:  #4F7CFF40; /* accent-tinted border (subtle) */

  /* === TYPOGRAPHY === */
  --ink-default:    #F0F2F8;   /* primary text */
  --ink-muted:      #8B90A7;   /* secondary text, labels */
  --ink-subtle:     #5A5F78;   /* tertiary, disabled, placeholders */
  --ink-inverse:    #0F1117;   /* text on light/accent backgrounds */

  /* === BRAND ACCENT === */
  --accent:         #4F7CFF;   /* primary interactive color */
  --accent-hover:   #6B94FF;   /* hover state */
  --accent-active:  #3D68E8;   /* pressed/active state */
  --accent-soft:    #1A2B5E;   /* accent background (tint) */
  --accent-border:  #2A3F8A;   /* accent-adjacent border */

  /* === STATUS — Company Category === */
  --prime:          #22D3A0;   /* Prime company */
  --prime-soft:     #0D3028;   /* Prime background */
  --average:        #F59E0B;   /* Average company */
  --average-soft:   #2D2000;   /* Average background */
  --below:          #F43F5E;   /* Below average */
  --below-soft:     #2D0A12;   /* Below average background */

  /* === STATUS — Drive State === */
  --drive-upcoming:  #F59E0B;
  --drive-active:    #22D3A0;
  --drive-completed: #5A5F78;
  --drive-cancelled: #F43F5E;

  /* === FUNNEL STAGES === */
  --stage-registered:  #6366F1;
  --stage-shortlisted: #F59E0B;
  --stage-interviewed: #3B82F6;
  --stage-offered:     #22D3A0;
  --stage-rejected:    #F43F5E;

  /* === FOCUS === */
  --focus-ring:     2px solid #4F7CFF;
  --focus-offset:   2px;

  /* === RADIUS === */
  --radius-sm:   6px;    /* inputs, badges */
  --radius-md:   8px;    /* buttons */
  --radius-card: 12px;   /* cards — HARD MAX for cards */
  --radius-lg:   16px;   /* modals, drawers */
  --radius-full: 9999px; /* pills, avatars */

  /* === SHADOWS (elevation system) === */
  --shadow-sm:   0 1px 2px rgba(0,0,0,0.4);
  --shadow-card: 0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04);
  --shadow-md:   0 4px 12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04);
  --shadow-modal:0 24px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06);

  /* === TIMING === */
  --duration-fast:   80ms;
  --duration-base:   150ms;
  --duration-slow:   250ms;
  --duration-slower: 400ms;
  --ease-out:        cubic-bezier(0.16, 1, 0.3, 1); /* expo-out — all UI motion */
}
```

---

## 3. Typography System

### 3.1 Font Loading

```tsx
// src/app/layout.tsx
import { DM_Sans } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

// Cabinet Grotesk via fontshare (not in next/font/google — use <link> in head)
```

```html
<!-- src/app/layout.tsx — inside <head> via Next.js metadata or link -->
<link rel="preconnect" href="https://api.fontshare.com" />
<link
  href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,600,700,800&display=swap"
  rel="stylesheet"
/>
```

### 3.2 Type Scale (Fixed Rem — Product Register)

Ratio: 1.333 (perfect fourth). No fluid clamp — this is an app, not a marketing page.

```css
/* Type Scale */
--text-xs:   0.75rem;   /* 12px — metadata, timestamps, captions */
--text-sm:   0.875rem;  /* 14px — table cells, secondary labels */
--text-base: 1rem;      /* 16px — body text, form fields (MINIMUM for body) */
--text-lg:   1.125rem;  /* 18px — card titles, emphasized body */
--text-xl:   1.333rem;  /* ~21px — section headings */
--text-2xl:  1.777rem;  /* ~28px — page titles */
--text-3xl:  2.369rem;  /* ~38px — dashboard KPIs */
--text-4xl:  3.157rem;  /* ~50px — hero stats (sparingly) */
```

### 3.3 Typographic Roles

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|------|------|------|--------|-------------|----------------|
| `display` | Cabinet Grotesk | 3xl–4xl | 700–800 | 1.1 | -0.02em |
| `page-title` | Cabinet Grotesk | 2xl | 700 | 1.2 | -0.01em |
| `section-heading` | Cabinet Grotesk | xl | 600 | 1.3 | -0.005em |
| `card-title` | Cabinet Grotesk | lg | 600 | 1.35 | 0 |
| `body` | DM Sans | base | 400 | 1.6 | 0 |
| `body-medium` | DM Sans | base | 500 | 1.6 | 0 |
| `label` | DM Sans | sm | 500 | 1.4 | 0.02em |
| `label-caps` | DM Sans | xs | 600 | 1 | 0.08em (ONLY FOR LABELS) |
| `caption` | DM Sans | xs | 400 | 1.4 | 0 |
| `data-value` | DM Sans | sm–lg | 600 | 1 | -0.01em |
| `code` | JetBrains Mono | sm | 400 | 1.6 | 0 |

### 3.4 Typography Rules

```
✅ DO: Use Cabinet Grotesk for all headings (h1–h3), KPI numbers, dashboard titles
✅ DO: Use DM Sans for all body, labels, form fields, table cells, captions
✅ DO: Line height 1.6 for any body text longer than one line
✅ DO: Max-width 65ch on all prose/description text
✅ DO: At least 1.333x size difference between adjacent heading levels
✅ DO: Weight contrast: if size doesn't differentiate, weight must (400 vs 600)

❌ DON'T: Set body text below 14px anywhere. 16px is the target.
❌ DON'T: Use letter-spacing on body text
❌ DON'T: Use the same font size for h2 and h3 — distinguish by weight OR size, not neither
❌ DON'T: Skip heading levels (h1 → h3 without h2) — screen reader crime
❌ DON'T: Set long text to all-caps. Status badges only.
```

### 3.5 Tailwind Utility Mapping

```tsx
// Typography utility classes — use these exact class combos, never one-off overrides

// Display (KPI numbers, dashboard stats)
className="font-display text-3xl font-bold leading-none tracking-tight"

// Page title (h1 equivalent)
className="font-display text-2xl font-bold leading-tight tracking-tight"

// Section heading (h2 equivalent)  
className="font-display text-xl font-semibold leading-snug"

// Card title (h3 equivalent)
className="font-display text-lg font-semibold leading-snug"

// Body text
className="font-body text-base text-ink leading-relaxed"

// Body secondary
className="font-body text-base text-ink-muted leading-relaxed"

// Label (form labels, table headers)
className="font-body text-sm font-medium text-ink-muted"

// Status label / badge text
className="font-body text-xs font-semibold uppercase tracking-widest"

// Caption / metadata
className="font-body text-xs text-ink-subtle"

// Data value (table cell numbers)
className="font-body text-sm font-semibold tabular-nums text-ink"
```

---

## 4. Color System

### 4.1 Rules for Color Application

```
Color carries meaning. Every use of color must answer: what does this communicate?

ACCENT (#4F7CFF):
  — Primary interactive elements (buttons, links, active nav items)
  — Focus rings
  — NOT for decoration. NOT for headings. NOT as background unless very muted.

STATUS COLORS (prime/average/below, funnel stages, drive states):
  — In badges, dots, and status indicators only
  — Backgrounds must use the *-soft variant (10-15% opacity of the solid color)
  — Text on colored background must be the solid color, not gray

SURFACE COLORS:
  — surface-base:  page background
  — surface-50:    card background
  — surface-100:   modal, dropdown background
  — surface-200:   tooltip, popover (topmost)
  — NEVER reverse the elevation order. A tooltip sits on surface-200, always.

INK COLORS:
  — ink-default:  primary text (headings, important labels, data values)
  — ink-muted:    secondary text (descriptions, supporting labels)
  — ink-subtle:   tertiary text, disabled states, placeholders
  — NEVER use raw Tailwind gray-* classes. Only the ink-* tokens.
```

### 4.2 Contrast Requirements

| Text Role | Background | Minimum Contrast | Target |
|-----------|-----------|-----------------|--------|
| Body text | Surface base | 7:1 | ink on surface-base = ✅ |
| Secondary text | Surface base | 4.5:1 | ink-muted on surface-base = ✅ |
| Disabled text | Surface base | 2.5:1 | ink-subtle = acceptable |
| Body text | Surface-50 (card) | 4.5:1 | verify each use |
| White text | Accent | 4.5:1 | verify — #4F7CFF is borderline |
| Status badge text | Soft bg | 4.5:1 | use solid color on soft-bg |

**Verify every new color combination with:** https://webaim.org/resources/contrastchecker/

### 4.3 Dark Mode Implementation

This project is dark-first. There is no light mode requirement in v1. Do not implement a toggler that doesn't exist. Do not use `dark:` prefixes speculatively. Establish the dark theme, ship it, leave room for light mode in v2.

---

## 5. Spacing & Layout Grid

### 5.1 Spacing Scale

The Tailwind default 4px base is the unit. Use values from this set only:

```
4px   (1)  — icon-text gap, badge padding-x
8px   (2)  — tight groupings, inner padding for dense elements
12px  (3)  — form field padding, chip padding
16px  (4)  — card padding (standard), section-internal spacing
20px  (5)  — card padding (comfortable), button padding-x
24px  (6)  — between related elements inside a section
32px  (8)  — between major elements within a card
48px  (12) — between cards/sections
64px  (16) — between major page sections
96px  (24) — page-level breathing room (rare)
```

**One-off values (p-[13px], mt-[22px]) are banned.** Use the nearest token.

### 5.2 Page Layout Structure

```tsx
// Every dashboard page follows this structure — no exceptions

// Page shell (layout.tsx already handles sidebar/header)
<div className="flex-1 min-h-0 overflow-y-auto">
  {/* Page header: title + primary action */}
  <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4">
    <div className="flex items-center justify-between max-w-screen-xl mx-auto">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Page Title</h1>
        <p className="text-sm text-ink-muted mt-0.5">Supporting description</p>
      </div>
      <PrimaryAction />
    </div>
  </div>

  {/* Page content */}
  <div className="px-6 py-6 max-w-screen-xl mx-auto space-y-6">
    {/* Content sections */}
  </div>
</div>
```

### 5.3 Card Rules

```tsx
// Standard card — the ONLY card variant for data
<div className="bg-surface-50 border border-border rounded-card shadow-card">
  <div className="p-4">
    {/* content */}
  </div>
</div>

// ❌ BANNED card patterns:
// border-l-4 border-accent rounded-xl  ← side-tab slop
// bg-white/5 backdrop-blur-md           ← glassmorphism slop
// rounded-3xl shadow-2xl               ← over-rounded + excessive shadow
// shadow-[0_0_30px_rgba(79,124,255,0.5)] ← glow slop
```

### 5.4 Grid Layouts

```tsx
// KPI metric row (dashboard top)
<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

// Company card listing
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

// Two-panel layout (list + detail)
<div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-0">

// Form layout (single column, full width within max-w)
<div className="max-w-2xl space-y-6">

// Sidebar layout (handled in layout.tsx)
<div className="flex h-screen overflow-hidden">
  <aside className="w-60 shrink-0 border-r border-border" />
  <main className="flex-1 min-h-0 overflow-y-auto" />
</div>
```

### 5.5 Sidebar Navigation Design

```
Sidebar width: 240px (w-60) — never wider, never narrower
Nav item height: 36px (h-9) — touch-friendly, not cramped
Active state: bg-accent-soft text-accent font-medium rounded-md
Hover state:  bg-surface-100 text-ink transition-colors duration-fast
Icon: 16px (w-4 h-4), optical center — NOT in a rounded container (anti-slop)
Section labels: text-xs uppercase tracking-widest text-ink-subtle px-3 mb-1
```

---

## 6. Motion & Animation

### 6.1 The Motion Contract

Motion must justify itself. Ask: "Does this animation communicate state, convey hierarchy, or guide attention?" If the answer is "it looks cool", remove it.

### 6.2 Duration Scale

```css
/* Duration choices */
--duration-fast:   80ms;   /* hover state color changes, focus rings */
--duration-base:  150ms;   /* button press, badge appearance */
--duration-slow:  250ms;   /* panel slide, drawer entrance */
--duration-slower:400ms;   /* modal entrance, page-level transitions */
```

### 6.3 Easing

```css
/* One easing function for all UI motion */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1); /* exponential ease-out */

/* Use for: entrances, reveals, drawer slides */

/* For exits (things leaving the screen): */
--ease-in: cubic-bezier(0.4, 0, 1, 1); /* faster, snappier exit */

/* ❌ BANNED: */
/* ease-bounce, cubic-bezier with overshoot (y > 1), elastic — all banned */
/* linear on anything except loading spinners and progress bars */
```

### 6.4 Tailwind Animation Extensions

```ts
// tailwind.config.ts — animation extensions
animation: {
  "fade-in":       "fade-in 250ms cubic-bezier(0.16,1,0.3,1) forwards",
  "slide-up":      "slide-up 250ms cubic-bezier(0.16,1,0.3,1) forwards",
  "slide-in-right":"slide-in-right 300ms cubic-bezier(0.16,1,0.3,1) forwards",
  "scale-in":      "scale-in 150ms cubic-bezier(0.16,1,0.3,1) forwards",
},
keyframes: {
  "fade-in":        { from: { opacity: "0" },                     to: { opacity: "1" } },
  "slide-up":       { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
  "slide-in-right": { from: { opacity: "0", transform: "translateX(16px)" }, to: { opacity: "1", transform: "translateX(0)" } },
  "scale-in":       { from: { opacity: "0", transform: "scale(0.95)" }, to: { opacity: "1", transform: "scale(1)" } },
},
```

### 6.5 Reduced Motion

**Non-negotiable.** Every animation must respect prefers-reduced-motion.

```tsx
// Wrap ALL animation in this hook
// src/hooks/use-reduced-motion.ts
import { useEffect, useState } from "react";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}
```

```css
/* Also in globals.css — catches anything not controlled by JS */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. Component Design Guidelines

### 7.1 Button System

```tsx
// src/components/ui/Button.tsx

// Variants: primary, secondary, ghost, danger, ghost-danger
// Sizes: sm, md (default), lg
// States: default, hover, active, focus, disabled, loading

// PRIMARY BUTTON
<button className="
  inline-flex items-center gap-2 px-5 h-9 rounded-md
  bg-accent text-white text-sm font-medium
  hover:bg-accent-hover active:bg-accent-active
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface
  disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
  transition-colors duration-fast
">

// SECONDARY BUTTON
<button className="
  inline-flex items-center gap-2 px-5 h-9 rounded-md
  bg-surface-100 text-ink text-sm font-medium border border-border-strong
  hover:bg-surface-200 hover:border-border-accent
  focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface
  disabled:opacity-40 disabled:cursor-not-allowed
  transition-colors duration-fast
">

// GHOST BUTTON
<button className="
  inline-flex items-center gap-2 px-3 h-9 rounded-md
  text-ink-muted text-sm font-medium
  hover:bg-surface-100 hover:text-ink
  focus-visible:ring-2 focus-visible:ring-accent
  transition-colors duration-fast
">

// DANGER BUTTON
<button className="
  inline-flex items-center gap-2 px-5 h-9 rounded-md
  bg-below/10 text-below border border-below/20 text-sm font-medium
  hover:bg-below/20 hover:border-below/40
  focus-visible:ring-2 focus-visible:ring-below
  transition-colors duration-fast
">
```

**Button Rules:**
- Minimum touch target: 36px height (h-9). Never shorter.
- Loading state: replace icon with `<Loader2 className="animate-spin" />`, disable button, preserve width with `min-w-[...]`.
- Never use gradient backgrounds on buttons.
- Never use `font-bold` on buttons. `font-medium` is maximum.

### 7.2 Form Fields

```tsx
// Input — standard
<div className="space-y-1.5">
  <label className="text-sm font-medium text-ink-muted block">
    Field Label
    {required && <span className="text-below ml-1" aria-label="required">*</span>}
  </label>
  <input
    className="
      w-full h-9 px-3 rounded-md text-sm
      bg-surface-50 border border-border text-ink
      placeholder:text-ink-subtle
      focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
      disabled:opacity-40 disabled:cursor-not-allowed
      transition-colors duration-fast
      aria-[invalid=true]:border-below aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-below
    "
    aria-invalid={!!error}
    aria-describedby={error ? `${id}-error` : undefined}
  />
  {error && (
    <p id={`${id}-error`} className="text-xs text-below flex items-center gap-1" role="alert">
      <AlertCircle className="w-3 h-3 shrink-0" aria-hidden />
      {error}
    </p>
  )}
</div>
```

**Form Rules:**
- Every input has a visible label. No placeholder-only inputs.
- Error messages use `role="alert"` for screen reader announcement.
- Error state uses `aria-invalid` and `aria-describedby`, not just red border.
- Required fields marked with `*` and screen reader text "required".
- Success state: green border + checkmark icon (not just removed error).

### 7.3 Status Badges

```tsx
// src/components/ui/Badge.tsx
// Compound token approach — color carries semantic meaning

const BADGE_VARIANTS = {
  // Company category
  prime:    { bg: "bg-prime-soft",   text: "text-prime",   dot: "bg-prime"   },
  average:  { bg: "bg-average-soft", text: "text-average", dot: "bg-average" },
  below:    { bg: "bg-below-soft",   text: "text-below",   dot: "bg-below"   },
  // Drive status
  active:   { bg: "bg-prime-soft",   text: "text-prime",   dot: "bg-prime animate-pulse" },
  upcoming: { bg: "bg-average-soft", text: "text-average", dot: "bg-average" },
  completed:{ bg: "bg-surface-100",  text: "text-ink-muted",dot:"bg-ink-subtle"},
  cancelled:{ bg: "bg-below-soft",   text: "text-below",   dot: "bg-below"   },
  // Funnel stages
  registered: { bg: "bg-[#6366F1]/10", text: "text-[#6366F1]", dot: "bg-[#6366F1]" },
  shortlisted:{ bg: "bg-average-soft", text: "text-average",   dot: "bg-average"   },
  interviewed:{ bg: "bg-[#3B82F6]/10", text: "text-[#3B82F6]", dot: "bg-[#3B82F6]" },
  offered:    { bg: "bg-prime-soft",   text: "text-prime",     dot: "bg-prime"     },
  not_selected:{ bg:"bg-below-soft",   text: "text-below",     dot: "bg-below"     },
} as const;

// Usage
<span className={`
  inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full
  text-xs font-semibold uppercase tracking-widest
  ${variant.bg} ${variant.text}
`}>
  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${variant.dot}`} aria-hidden />
  {label}
</span>
```

### 7.4 Data Tables

```tsx
// Table design — NOT a card-inside-a-card. Table sits on surface-base.
<div className="border border-border rounded-card overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="border-b border-border bg-surface-50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">
            Column Header
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {rows.map((row) => (
          <tr
            key={row.id}
            className="hover:bg-surface-50/50 transition-colors duration-fast group"
          >
            <td className="px-4 py-3 text-ink tabular-nums">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

// Rules:
// — tabular-nums on all numeric cells (consistent column width)
// — Sticky header when table exceeds viewport: sticky top-0 bg-surface-50
// — Empty state: centered in tbody, full-width td with colspan
// — Row hover: very subtle bg change, not color change on text
// — No alternating row colors (zebra striping) — use hover + dividers
```

### 7.5 Modals & Drawers

```tsx
// Modal rules:
// — Max-width: max-w-lg (512px) for confirmations, max-w-2xl for forms
// — Scroll INSIDE modal content, not the entire modal
// — Focus trap: required. Use @radix-ui/react-dialog.
// — Escape to close: always.
// — Click-outside to close: always (except destructive confirmation modals).
// — Never put a data table inside a modal that needs horizontal scroll.
//   If it needs more space, it needs its own page.

// Drawer rules:
// — Use for detail panels (student detail, company detail)
// — Width: 480px on desktop, full-screen on mobile
// — Slides from right: translate-x-full → translate-x-0
// — Overlay: bg-black/40 backdrop-blur-[2px] (barely perceptible blur)

// ❌ NEVER: 
// Complex multi-column form layouts inside a modal
// Tables with horizontal scroll inside a modal
// Modals that launch other modals
```

### 7.6 KPI Metric Cards

```tsx
// Dashboard KPI card — avoiding the "hero metric layout" anti-pattern
// The anti-pattern: big gradient number + tiny label + 3 sub-stats.
// Our approach: functional data, no decoration.

<div className="bg-surface-50 border border-border rounded-card p-4 shadow-card">
  <div className="flex items-center justify-between mb-3">
    <span className="text-sm font-medium text-ink-muted">{label}</span>
    {/* Icon: 16px, NO container box around it */}
    <Icon className="w-4 h-4 text-ink-subtle" aria-hidden />
  </div>
  <div className="font-display text-3xl font-bold text-ink tabular-nums leading-none">
    {value}
  </div>
  {trend && (
    <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
      trend > 0 ? "text-prime" : "text-below"
    }`}>
      <TrendIcon className="w-3 h-3" aria-hidden />
      <span>{Math.abs(trend)}% vs last month</span>
    </div>
  )}
</div>
```

### 7.7 Empty States

```tsx
// Every list, table, and data section must have an empty state.
// Empty states are NOT an afterthought — they are the first impression for new users.

<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
  {/* Icon: larger here — 32px — but still NO container box */}
  <ComponentIcon className="w-8 h-8 text-ink-subtle mb-4" aria-hidden />
  <h3 className="font-display text-lg font-semibold text-ink mb-1">
    No {resourceName} yet
  </h3>
  <p className="text-sm text-ink-muted max-w-xs mb-6">
    {contextualDescription} {/* Specific to the context, not generic "Nothing here" */}
  </p>
  {canCreate && (
    <Button variant="primary" onClick={onCreate}>
      Add {resourceName}
    </Button>
  )}
</div>
```

### 7.8 Toast Notifications

```
Use sonner (recommended) or react-hot-toast.
Position: bottom-right
Max visible: 3 simultaneously
Auto-dismiss:
  — Success: 4 seconds
  — Info: 5 seconds  
  — Error: 8 seconds (user must read it)
  — Never auto-dismiss critical errors

Severity colors:
  — Success: text-prime with prime-soft background
  — Error: text-below with below-soft background  
  — Warning: text-average with average-soft background
  — Info: text-accent with accent-soft background
```

---

## 8. Routing Architecture

### 8.1 Next.js App Router Structure

```
src/app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx          # No layout wrapper, full-page centered
│   └── layout.tsx             # Centered, dark gradient background
├── (dashboard)/
│   ├── layout.tsx             # Sidebar + header shell
│   ├── super-admin/
│   │   ├── layout.tsx         # Role guard: checks session.user.role === "SUPER_ADMIN"
│   │   ├── page.tsx           # Dashboard — dynamic, use generateMetadata
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   └── admins/
│   │       ├── page.tsx       # List
│   │       └── [id]/
│   │           └── page.tsx   # Detail
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── companies/
│   │   │   ├── page.tsx       # List with filters
│   │   │   ├── new/
│   │   │   │   └── page.tsx   # Create form
│   │   │   └── [id]/
│   │   │       ├── page.tsx   # Detail / edit
│   │   │       └── drives/
│   │   │           └── page.tsx
│   │   ├── drives/
│   │   ├── students/
│   │   ├── internships/
│   │   ├── consent-forms/
│   │   └── reports/
│   └── student/
│       ├── layout.tsx
│       ├── page.tsx
│       ├── companies/
│       ├── applications/
│       └── consent-forms/
└── api/
    └── v1/
        └── ...
```

### 8.2 Layout Nesting Rules

```tsx
// (dashboard)/layout.tsx — shared shell
// This renders once and NEVER unmounts during navigation (App Router default)
// Sidebar, header, and session context live here

// Role-specific layouts add an RBAC check:
// (dashboard)/admin/layout.tsx
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");
  return <>{children}</>;
}
```

### 8.3 Navigation — Active State

```tsx
// src/components/layout/NavItem.tsx
// NEVER use <a> for internal navigation. Always <Link>.
// Active state detection: use usePathname() from next/navigation

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavItem({ href, icon: Icon, label }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-3 h-9 rounded-md text-sm transition-colors duration-fast
        ${isActive
          ? "bg-accent-soft text-accent font-medium"
          : "text-ink-muted hover:bg-surface-100 hover:text-ink"
        }
      `}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="w-4 h-4 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </Link>
  );
}
```

### 8.4 URL State for Filters

```tsx
// Filters, search, sort: live in URL search params.
// NEVER in component state for list pages.
// This enables: sharing links, browser back/forward, bookmarks.

// src/hooks/use-filters.ts
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

export function useFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setFilter = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page"); // Reset to page 1 on filter change
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  return { searchParams, setFilter };
}
```

### 8.5 Parallel Routes for Drawers

```tsx
// Use Next.js parallel routes for detail drawers.
// The list page stays visible while the detail panel opens alongside it.

// app/(dashboard)/admin/companies/@drawer/[id]/page.tsx
// app/(dashboard)/admin/companies/layout.tsx — renders {children} + {drawer}

// Intercept routes for modal-based navigation (e.g., clicking a student name shows a modal):
// app/(dashboard)/admin/students/@modal/(.)students/[id]/page.tsx
```

---

## 9. State Management

### 9.1 State Architecture

State lives at the lowest possible level. Escalate only when necessary.

```
Level 1: Local component state (useState)
  — Form field values while editing
  — UI toggles (dropdown open/closed)
  — Loading/error state for a single action

Level 2: URL state (searchParams)
  — Filters, search, sort, active tab, pagination page
  — Anything that should survive a page refresh or be shareable

Level 3: Context (React Context + useReducer)
  — Current user session (read from server, but surfaced to client)
  — Sidebar collapsed state (persisted to localStorage)
  — Toast queue

Level 4: Zustand (global app state)
  — ONLY if Context becomes unwieldy
  — Do not reach for Zustand on day 1. Start with Context. Migrate if needed.

Level 5: Server state (TanStack Query or SWR)
  — All server data: companies, drives, students, reports
  — Never copy server data into local/global state. Let the cache manage it.
```

### 9.2 Server State — SWR Pattern

```tsx
// src/hooks/use-companies.ts
import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("API error") as Error & { status: number };
    error.status = res.status;
    throw error;
  }
  return res.json();
};

export function useCompanies(params: CompanyFilters) {
  const queryString = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
  ).toString();

  const { data, error, isLoading, mutate } = useSWR(
    `/api/v1/admin/companies?${queryString}`,
    fetcher,
    {
      revalidateOnFocus: false,    // Don't refetch when user switches tabs
      revalidateOnReconnect: true, // Refetch on network reconnect
      dedupingInterval: 5000,      // Deduplicate requests within 5 seconds
      keepPreviousData: true,      // Show previous page data during pagination
    }
  );

  return {
    companies: data?.data ?? [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
  };
}
```

### 9.3 Optimistic Updates

```tsx
// NEVER wait for an API call to update the UI for reversible actions.
// Optimistic updates keep the UI feeling instant.

async function handleStageChange(applicationId: string, newStage: FunnelStage) {
  // 1. Store previous data for rollback
  const prevData = await mutate(
    (current) => ({
      ...current,
      data: current.data.map((app: Application) =>
        app.id === applicationId ? { ...app, stage: newStage } : app
      ),
    }),
    false // Don't revalidate yet
  );

  try {
    await fetch(`/api/v1/admin/drives/${driveId}/applications/${applicationId}`, {
      method: "PATCH",
      body: JSON.stringify({ stage: newStage }),
      headers: { "Content-Type": "application/json" },
    });
    await mutate(); // Revalidate after success
  } catch (err) {
    // Rollback on failure
    mutate(prevData, false);
    toast.error("Failed to update stage. Please try again.");
  }
}
```

### 9.4 Form State — React Hook Form + Zod

```tsx
// NEVER manage form state with useState per field.
// Always use react-hook-form. Always validate with Zod.

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateCompanySchema, type CreateCompanyInput } from "@/lib/validations/company.schema";

export function CompanyForm({ onSuccess }: { onSuccess: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm<CreateCompanyInput>({
    resolver: zodResolver(CreateCompanySchema),
    defaultValues: {
      category: "AVERAGE",
    },
  });

  const onSubmit = async (data: CreateCompanyInput) => {
    const res = await fetch("/api/v1/admin/companies", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const json = await res.json();
      if (json.error?.details?.fieldErrors) {
        // Map server validation errors back to form fields
        Object.entries(json.error.details.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof CreateCompanyInput, { message: (messages as string[])[0] });
        });
      }
      return;
    }

    toast.success("Company added successfully");
    reset();
    onSuccess();
  };

  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
}
```

### 9.5 Session Context

```tsx
// src/contexts/session-context.tsx
"use client";
import { createContext, useContext } from "react";
import type { Session } from "next-auth";

const SessionContext = createContext<Session | null>(null);

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be inside SessionProvider");
  return ctx;
}

// In layout.tsx (server component):
// const session = await auth();
// Pass to client via a provider:
// <SessionProvider session={session}>{children}</SessionProvider>
```

---

## 10. Pagination

### 10.1 Strategy

Use **cursor-based pagination** for large datasets (student lists, activity logs). Use **offset pagination** for small, filterable datasets (companies, drives) where users expect page numbers.

### 10.2 Offset Pagination Component

```tsx
// src/components/ui/Pagination.tsx
"use client";
import { useFilters } from "@/hooks/use-filters";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  total: number;
  page: number;
  limit: number;
}

export function Pagination({ total, page, limit }: PaginationProps) {
  const { setFilter } = useFilters();
  const pages = Math.ceil(total / limit);

  if (pages <= 1) return null;

  // Show: first, ..., current-1, current, current+1, ..., last
  const getVisiblePages = (): (number | "ellipsis")[] => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    const result: (number | "ellipsis")[] = [1];
    if (page > 3) result.push("ellipsis");
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) result.push(i);
    if (page < pages - 2) result.push("ellipsis");
    result.push(pages);
    return result;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <p className="text-sm text-ink-muted">
        {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setFilter("page", String(page - 1))}
          disabled={page === 1}
          className="h-8 w-8 rounded-md flex items-center justify-center text-ink-muted hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-fast"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden />
        </button>
        {getVisiblePages().map((p, i) =>
          p === "ellipsis" ? (
            <span key={`e-${i}`} className="w-8 text-center text-sm text-ink-subtle">…</span>
          ) : (
            <button
              key={p}
              onClick={() => setFilter("page", String(p))}
              className={`h-8 w-8 rounded-md text-sm transition-colors duration-fast ${
                p === page
                  ? "bg-accent text-white font-medium"
                  : "text-ink-muted hover:bg-surface-100"
              }`}
              aria-current={p === page ? "page" : undefined}
              aria-label={`Page ${p}`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => setFilter("page", String(page + 1))}
          disabled={page === pages}
          className="h-8 w-8 rounded-md flex items-center justify-center text-ink-muted hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-fast"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
```

### 10.3 Pagination Rules

```
✅ DO: Show "X–Y of Z" total count alongside page controls
✅ DO: Disable previous/next at boundaries (not hide them)
✅ DO: Keep current page in URL (?page=3) — never in useState
✅ DO: Reset page to 1 when filters or search changes
✅ DO: Use keepPreviousData: true in SWR — no content flash on page change
✅ DO: Announce page changes to screen readers (aria-live on the list container)

❌ DON'T: Infinite scroll for data management tables (admin can't bookmark row 847)
❌ DON'T: Load all pages into memory and paginate client-side
❌ DON'T: Hide pagination when there's only one page (show a disabled state or null)
❌ DON'T: Use pagination inside a card that's inside another card
```

---

## 11. Modularity & Component Composition

### 11.1 Component Categories

```
LAYOUT components — never have data fetching logic
  Header, Sidebar, PageShell, DashboardGrid, SectionDivider
  Props: children, className only. No domain logic.

FEATURE components — data-aware, domain-specific
  CompanyCard, StudentFunnelRow, DriveStatusBadge, ConsentFormList
  Import hooks, use SWR, know about the domain.
  Kept in: src/components/admin/, src/components/student/

UI components — dumb, generic, reusable
  Button, Input, Badge, Modal, Pagination, Table, Skeleton, Toast
  Kept in: src/components/ui/
  Rules: no hardcoded text, no domain knowledge, prop-driven styling

PAGE components — compose feature + layout components
  CompaniesPage, DriveDetailPage, StudentDashboard
  Live in: src/app/...
  Minimal logic: mostly composition of feature components
```

### 11.2 Component File Structure

```tsx
// Every component file follows this order:
// 1. Imports
// 2. Types/interfaces
// 3. Constants (outside component)
// 4. Main export
// 5. Subcomponents (if colocated)

// src/components/admin/CompanyCard.tsx

import type { Company } from "@/types/api.types";
import { Badge } from "@/components/ui/Badge";
import { Building2, MapPin } from "lucide-react";

// ---- TYPES ----
interface CompanyCardProps {
  company: Company;
  onSelect?: (id: string) => void;
}

// ---- CONSTANTS (extracted outside — stable reference, no re-creation) ----
const CATEGORY_LABELS: Record<Company["category"], string> = {
  PRIME:         "Prime",
  AVERAGE:       "Average",
  BELOW_AVERAGE: "Below Avg",
};

// ---- COMPONENT ----
export function CompanyCard({ company, onSelect }: CompanyCardProps) {
  return (
    <article
      className="bg-surface-50 border border-border rounded-card p-4 shadow-card card-interactive cursor-pointer"
      onClick={() => onSelect?.(company.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect?.(company.id)}
      aria-label={`${company.name} — ${company.jobRole}`}
    >
      {/* content */}
    </article>
  );
}
```

### 11.3 Barrel Exports

```tsx
// src/components/ui/index.ts — barrel export
export { Button } from "./Button";
export { Input } from "./Input";
export { Badge } from "./Badge";
export { Modal } from "./Modal";
export { Pagination } from "./Pagination";
export { Skeleton } from "./Skeleton";
export { Table } from "./Table";

// Usage: import { Button, Badge, Modal } from "@/components/ui";
// ❌ NEVER: import { Button } from "@/components/ui/Button";
//           (unless the file is the index itself — importing across barrels is fine)
```

### 11.4 Props Design Rules

```tsx
// ✅ Prefer specific props over spreading objects
interface GoodProps {
  companyName: string;
  category: CompanyCategory;
  driveStatus: DriveStatus;
}

// ❌ Avoid God objects in component props
interface BadProps {
  company: Company; // forces caller to construct a full Company object
  drive: Drive;
}
// Exception: detail pages that own the full entity

// ✅ Use discriminated unions for multi-mode components
type ButtonProps =
  | { variant: "primary"; onClick: () => void }
  | { variant: "link"; href: string };

// ✅ Always define explicit return types for exported functions
export function CompanyCard(props: CompanyCardProps): JSX.Element { ... }

// ✅ Children props must be typed
interface CardProps {
  children: React.ReactNode; // generic content
  header: React.ReactElement<typeof CardHeader>; // specific component type
}
```

---

## 12. Performance — Memoization & Re-render Prevention

### 12.1 When to Memoize (and When Not To)

```
The rule: profile first, memoize second. Premature memoization adds complexity
without benefit — useMemo and useCallback have their own cost.

ALWAYS memoize:
  — Expensive computations (sorting 1000+ items, complex filtering logic)
  — Callbacks passed to child components that are themselves memoized
  — Values passed as context (prevents all consumers from re-rendering)

NEVER memoize:
  — Primitive values (strings, numbers, booleans)
  — Components that don't receive callback props
  — Components that always re-render anyway (their parent changes)
  — Functions called within the same component, not passed down
```

### 12.2 React.memo — Correct Usage

```tsx
// Only wrap with React.memo if:
// 1. The component renders often (part of a list)
// 2. Its props rarely change
// 3. It does meaningful work (not a 3-line component)

// ✅ Good candidate — rendered in a list, receives stable props
export const CompanyRow = React.memo(function CompanyRow({
  name,
  category,
  status,
  onSelect,
}: CompanyRowProps) {
  return ( ... );
});

// Check: if onSelect changes on every render of the parent, React.memo is useless.
// The parent MUST use useCallback on onSelect.

// ✅ Parent with stabilized callback
function CompanyList() {
  const handleSelect = useCallback((id: string) => {
    router.push(`/admin/companies/${id}`);
  }, [router]); // router is stable in Next.js App Router

  return (
    <div>
      {companies.map((c) => (
        <CompanyRow key={c.id} {...c} onSelect={handleSelect} />
      ))}
    </div>
  );
}
```

### 12.3 useCallback — Correct Usage

```tsx
// ✅ useCallback: callback passed to memoized child
const handleStageChange = useCallback(async (appId: string, stage: FunnelStage) => {
  await updateStage(appId, stage);
}, [updateStage]); // updateStage must be stable (from a hook, not inline)

// ❌ useCallback overkill: callback used only internally
// This adds complexity with zero benefit:
const handleLocalToggle = useCallback(() => {
  setOpen((prev) => !prev);
}, []); // Don't do this. Just write: () => setOpen(prev => !prev)
```

### 12.4 useMemo — Correct Usage

```tsx
// ✅ useMemo: expensive computation
const sortedStudents = useMemo(() => {
  return [...students].sort((a, b) => {
    if (sort.field === "cgpa") return sort.dir === "asc"
      ? Number(a.cgpa) - Number(b.cgpa)
      : Number(b.cgpa) - Number(a.cgpa);
    return sort.dir === "asc"
      ? a.name.localeCompare(b.name)
      : b.name.localeCompare(a.name);
  });
}, [students, sort.field, sort.dir]); // Only recomputes when students or sort changes

// ✅ useMemo: stable context value
const sessionContextValue = useMemo(
  () => ({ user: session.user, role: session.user.role }),
  [session.user]
);

// ❌ useMemo overkill — simple object creation
// const options = useMemo(() => ({ key: value }), [value]);
// Just write: const options = { key: value }; (re-creation is cheaper than memo overhead)
```

### 12.5 Context Re-render Prevention

```tsx
// ❌ BAD: Object created inline — new reference every render — ALL consumers re-render
<ThemeContext.Provider value={{ theme, setTheme }}>

// ✅ GOOD: Stabilized with useMemo — consumers re-render only when theme changes
const themeValue = useMemo(() => ({ theme, setTheme }), [theme]);
<ThemeContext.Provider value={themeValue}>

// ✅ BETTER: Split context into read (frequently updated) and dispatch (stable)
const ThemeStateContext = createContext<Theme>(null!);
const ThemeDispatchContext = createContext<Dispatch<SetStateAction<Theme>>>(null!);

// Components that only need to read don't re-render on dispatch changes, and vice versa.
```

### 12.6 List Rendering Optimization

```tsx
// ✅ Always use stable, unique keys — never array index
companies.map((c) => <CompanyCard key={c.id} ... />)

// ❌ Index as key — breaks reconciliation on reorder/filter
companies.map((c, i) => <CompanyCard key={i} ... />) // WRONG

// For very long lists (500+ items): use TanStack Virtual
import { useVirtualizer } from "@tanstack/react-virtual";

function StudentTable({ students }: { students: Student[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: students.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48, // row height
    overscan: 10,
  });

  return (
    <div ref={parentRef} className="overflow-y-auto max-h-[600px]">
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <StudentRow
            key={students[virtualRow.index].id}
            style={{ transform: `translateY(${virtualRow.start}px)`, position: "absolute", width: "100%" }}
            student={students[virtualRow.index]}
          />
        ))}
      </div>
    </div>
  );
}
```

### 12.7 Heavy Component Code Splitting

```tsx
// Defer loading of heavy components (chart libraries, rich text editors, e-sign canvas)
import { lazy, Suspense } from "react";

const ConsentFormEditor = lazy(() => import("@/components/admin/ConsentFormEditor"));
const AnalyticsChart    = lazy(() => import("@/components/admin/AnalyticsChart"));
const ESignCanvas       = lazy(() => import("@/components/shared/ESignCanvas"));

// Wrap with meaningful Suspense boundary (not just a spinner)
<Suspense fallback={<ChartSkeleton />}>
  <AnalyticsChart data={analyticsData} />
</Suspense>
```

---

## 13. Memory Leak Prevention

Every leak pattern listed here has caused production issues in React apps. Treat them as P0 bugs.

### 13.1 Event Listeners

```tsx
// ❌ LEAK: listener added but never removed
useEffect(() => {
  window.addEventListener("resize", handleResize);
  // Missing return: listener lives forever after unmount
}, []);

// ✅ CORRECT: cleanup function removes the listener
useEffect(() => {
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, [handleResize]); // handleResize must be stable (useCallback or defined outside)
```

### 13.2 Async Operations After Unmount

```tsx
// ❌ LEAK: setState called on unmounted component
useEffect(() => {
  fetch("/api/v1/admin/companies")
    .then((res) => res.json())
    .then((data) => setCompanies(data)); // UNSAFE — component may be unmounted
}, []);

// ✅ CORRECT: AbortController cancels in-flight requests
useEffect(() => {
  const controller = new AbortController();

  fetch("/api/v1/admin/companies", { signal: controller.signal })
    .then((res) => res.json())
    .then((data) => setCompanies(data))
    .catch((err) => {
      if (err.name === "AbortError") return; // Ignore cancellation
      console.error("Fetch failed:", err);
    });

  return () => controller.abort();
}, []);

// Note: If using SWR/React Query, they handle this automatically.
// Only write raw fetch inside useEffect for one-off needs.
```

### 13.3 Timers and Intervals

```tsx
// ❌ LEAK: interval keeps firing after unmount
useEffect(() => {
  const id = setInterval(() => {
    checkInternshipAlerts();
  }, 30_000);
  // Missing cleanup
}, []);

// ✅ CORRECT: clear on unmount
useEffect(() => {
  const id = setInterval(() => checkInternshipAlerts(), 30_000);
  return () => clearInterval(id);
}, [checkInternshipAlerts]);

// ✅ ALSO CORRECT: setTimeout for one-shot delays
useEffect(() => {
  const id = setTimeout(() => setShowWelcome(false), 5_000);
  return () => clearTimeout(id);
}, []);
```

### 13.4 Subscriptions & WebSockets

```tsx
// If adding real-time notifications later (WebSocket or SSE):

useEffect(() => {
  const evtSource = new EventSource("/api/v1/notifications/stream");
  evtSource.onmessage = (e) => {
    const data = JSON.parse(e.data);
    handleNotification(data);
  };
  evtSource.onerror = () => evtSource.close();

  return () => evtSource.close(); // Always close on unmount
}, [handleNotification]);
```

### 13.5 Observer APIs

```tsx
// IntersectionObserver (used for lazy loading, scroll-triggered animations)
useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) setVisible(true);
    },
    { threshold: 0.1 }
  );

  if (ref.current) observer.observe(ref.current);
  return () => observer.disconnect(); // Critical cleanup
}, []);

// ResizeObserver (used for responsive chart dimensions)
useEffect(() => {
  const observer = new ResizeObserver(([entry]) => {
    setWidth(entry.contentRect.width);
  });
  if (ref.current) observer.observe(ref.current);
  return () => observer.disconnect();
}, []);
```

### 13.6 Canvas Cleanup

```tsx
// react-signature-canvas memory leak prevention
useEffect(() => {
  return () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.off(); // Remove all canvas event listeners
    }
  };
}, []);
```

---

## 14. Frontend Security

### 14.1 XSS Prevention

```tsx
// ❌ CRITICAL: Never use dangerouslySetInnerHTML with unsanitized content
<div dangerouslySetInnerHTML={{ __html: consentFormContent }} />  // NEVER unguarded

// ✅ CORRECT: Sanitize BEFORE rendering rich text content
import DOMPurify from "dompurify";

const ALLOWED_TAGS = ["p", "strong", "em", "ul", "ol", "li", "br", "h2", "h3", "a"];
const ALLOWED_ATTR = ["href", "target", "rel"]; // rel="noopener noreferrer" enforced

function SafeRichText({ html }: { html: string }) {
  const sanitized = useMemo(
    () => DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR }),
    [html]
  );
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}

// Also enforce rel on links after sanitize:
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
});
```

### 14.2 Authentication Guards

```tsx
// Never trust client-side role checks for data access.
// Client-side checks are UX (hide UI elements), not security (protect data).

// ✅ Conditionally render admin-only UI elements:
const { role } = useSession();
{role === "ADMIN" && <DeleteButton />}

// This hides the button. The API route ALSO checks the role and rejects unauthorized calls.
// The client check is comfort UX. The API check is actual security.

// ❌ NEVER use client-side role as the only protection:
// if (role === "ADMIN") { await fetch("/api/v1/admin/delete") } // The API route still runs if someone bypasses this
```

### 14.3 Sensitive Data Exposure

```tsx
// ❌ NEVER log sensitive data to the browser console
console.log("User session:", session);     // includes JWT, email, role
console.log("API response:", responseData); // may include student data

// ✅ Log only in development, sanitize what you log
if (process.env.NODE_ENV === "development") {
  console.log("[Debug] Drive ID:", driveId);
}

// ❌ NEVER store sensitive data in localStorage
localStorage.setItem("jwt", token); // readable by any JS on the page

// ✅ Let NextAuth handle session storage (httpOnly cookies)
// The session object available via useSession() is safe to use client-side
// (it's the public portion — no refresh token, no raw JWT)
```

### 14.4 Form Security

```tsx
// Autocomplete attributes protect users and prevent autofill attacks
<input type="email" autoComplete="email" />
<input type="password" autoComplete="current-password" />
<input type="new-password" autoComplete="new-password" />

// ❌ NEVER disable autocomplete globally:
// <form autoComplete="off"> — harms UX and accessibility

// File upload validation (client-side is UX, server-side is security)
function validateFile(file: File): string | null {
  const ALLOWED = ["application/pdf", "image/jpeg", "image/png"];
  const MAX_MB  = 10;
  if (!ALLOWED.includes(file.type)) return `Only PDF, JPG, PNG allowed (got ${file.type})`;
  if (file.size > MAX_MB * 1024 * 1024) return `File must be under ${MAX_MB}MB`;
  return null;
}
```

### 14.5 Open Redirect Prevention

```tsx
// ❌ NEVER redirect to a URL from query params without validation
const redirectTo = searchParams.get("redirect");
router.push(redirectTo); // Attacker can set redirect=https://evil.com

// ✅ Validate redirects are internal only
function getSafeRedirect(url: string | null, fallback: string): string {
  if (!url) return fallback;
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin !== window.location.origin) return fallback;
    return parsed.pathname + parsed.search;
  } catch {
    return fallback;
  }
}

router.push(getSafeRedirect(searchParams.get("redirect"), "/admin"));
```

### 14.6 Content Security Policy Adherence

```tsx
// Our CSP (set in next.config.js) bans inline event handlers.
// All event handlers MUST be in JSX props, never inline HTML.

// ❌ BANNED (violates CSP):
// <button onclick="doSomething()">Click</button>

// ✅ CORRECT:
// <button onClick={doSomething}>Click</button>

// No eval(), no new Function(), no dynamically injected scripts.
// Dynamic imports via import() are fine — they're handled at build time.
```

### 14.7 Dependency Security

```bash
# Run this before every deploy:
npm audit --audit-level=high

# Keep dependencies updated (use Dependabot or Renovate):
# .github/dependabot.yml already configured

# NEVER install unreviewed packages for UI components.
# The design system is custom. If you need a missing component,
# build it — don't add a random npm package with 12 stars.
```

---

## 15. Accessibility

### 15.1 Non-Negotiables

```
Every shipped component must pass these checks — no exceptions:

✅ Color contrast: 4.5:1 minimum for body text, 3:1 for large text and UI components
✅ Keyboard navigation: all interactive elements reachable and operable via keyboard
✅ Focus indicators: visible on ALL interactive elements (our focus ring style is mandatory)
✅ Screen reader labels: every icon-only button has aria-label
✅ Form labels: every input has a visible, associated <label> (no placeholder-only)
✅ Error announcement: errors use role="alert" or aria-live="polite"
✅ Heading hierarchy: no skipped levels (h1 → h2 → h3, never h1 → h3)
✅ Semantic HTML: <button> for actions, <a> for navigation, <nav> for nav, <main> for main
✅ Images: alt text for informational images, alt="" for decorative images
✅ Motion: prefers-reduced-motion respected for ALL animations
```

### 15.2 Focus Ring — Mandatory Style

```css
/* Every interactive element must show this focus ring — no exceptions */
/* Never: outline: none without a replacement */

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* For elements with their own Tailwind focus utilities: */
/* focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface */
```

### 15.3 ARIA Patterns for Common Components

```tsx
// Dialog / Modal
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Add Company</h2>
</div>

// Table with sortable columns
<th
  aria-sort={sort.field === "name" ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
  onClick={() => handleSort("name")}
  className="cursor-pointer"
>

// Status live region (funnel stage update)
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {lastUpdatedMessage} {/* e.g. "Arjun Kumar moved to Shortlisted" */}
</div>

// Loading state
<div aria-busy={isLoading} aria-label="Loading companies">
  {isLoading ? <SkeletonList /> : <CompanyList />}
</div>

// Icon-only button
<button aria-label="Delete company" title="Delete company">
  <Trash2 className="w-4 h-4" aria-hidden />
</button>
```

---

## 16. Error States, Empty States & Loading

### 16.1 Skeleton Loading

```tsx
// src/components/ui/Skeleton.tsx
// Use CSS animation, not JavaScript intervals

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`bg-surface-100 rounded animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}

// Match the SHAPE of the content being loaded — not generic blocks
// ✅ Card skeleton mirrors the actual card layout
function CompanyCardSkeleton() {
  return (
    <div className="bg-surface-50 border border-border rounded-card p-4">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-24 mb-4" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}
```

### 16.2 Error Boundaries

```tsx
// src/components/ui/ErrorBoundary.tsx
"use client";
import { Component } from "react";

interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<{ children: React.ReactNode; fallback?: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production: send to error tracking (Sentry, etc.)
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-sm text-ink-muted">Something went wrong loading this section.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 text-sm text-accent hover:underline"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Use around every major section:
<ErrorBoundary>
  <CompanyList />
</ErrorBoundary>
```

### 16.3 API Error Handling Pattern

```tsx
// Every data-fetching hook must expose an error state
// Every component using the hook must handle it visibly

function CompanyList() {
  const { companies, isLoading, error } = useCompanies(filters);

  if (error?.status === 403) return <ForbiddenState />;
  if (error?.status === 404) return <NotFoundState />;
  if (error)                 return <GenericErrorState onRetry={mutate} />;
  if (isLoading)             return <SkeletonGrid count={6} />;
  if (companies.length === 0) return <EmptyState />;
  return <div className="grid ...">{companies.map(...)}</div>;
}
```

---

## 17. Component Checklist

Run this checklist before marking any component as "done". Every item must be checked.

### Visual Quality
- [ ] No anti-slop patterns from Section 1 present (run the list mentally)
- [ ] Typography matches the typographic role table in Section 3.3
- [ ] Colors use only token values — no raw hex, no raw Tailwind grays
- [ ] Spacing uses the spacing scale from Section 5.1 — no one-off values
- [ ] Card radius is ≤12px (rounded-xl max)
- [ ] No side-tab borders (border-l-{n}) on rounded elements
- [ ] Shadow uses one of the four defined shadow tokens only

### States
- [ ] Default state ✓
- [ ] Hover state ✓ (cursor-pointer + bg/color change, never scale)
- [ ] Focus-visible state ✓ (ring-2 ring-accent)
- [ ] Active/pressed state ✓ (scale-95 or darker bg)
- [ ] Loading state ✓ (skeleton or spinner)
- [ ] Empty state ✓ (meaningful, context-specific message)
- [ ] Error state ✓ (visible, actionable)
- [ ] Disabled state ✓ (opacity-40, cursor-not-allowed)

### Accessibility
- [ ] All interactive elements keyboard-accessible
- [ ] Focus indicator visible
- [ ] Icon-only buttons have aria-label
- [ ] Images have alt text (empty string if decorative)
- [ ] Error messages use role="alert"
- [ ] Heading levels not skipped
- [ ] Color contrast ≥4.5:1 for text

### Performance
- [ ] Lists use stable, unique keys (not index)
- [ ] Callbacks passed to child components use useCallback
- [ ] Heavy imports are lazy-loaded
- [ ] No inline object/array creation in render that causes needless re-renders
- [ ] useEffect cleanup function present if listeners/timers/subscriptions added

### Security
- [ ] dangerouslySetInnerHTML content is DOMPurify-sanitized
- [ ] No sensitive data in console.log
- [ ] No sensitive data in localStorage/sessionStorage
- [ ] File uploads validated before processing
- [ ] External links use rel="noopener noreferrer"

### Code Quality
- [ ] Component is under 200 lines (if longer: extract subcomponents)
- [ ] Props are typed with TypeScript interfaces (no `any`)
- [ ] No hardcoded text strings that should be variables
- [ ] No TODO comments in shipped code

---

*This directive is maintained by the frontend lead. All PRs modifying UI components must reference the relevant section of this document in the PR description. Violations of the Anti-Slop Rulebook (Section 1) are P0 — they block merge.*

*Last updated: May 2026*