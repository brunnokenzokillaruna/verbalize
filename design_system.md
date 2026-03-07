# Design System

Verbalize uses a **Warm Academic** aesthetic — an editorial language-learning environment that feels encouraging, focused, and premium without being sterile. The design draws from the warmth of Brazilian culture (golden light, natural textures) and the precision of European language learning materials.

**Aesthetic pillars:**
- Warm off-white backgrounds — never cold or clinical
- Editorial headings paired with clean UI body text
- Color used intentionally as a pedagogical tool, not decoration
- Animations that reward progress without distracting from it

---

## 1. Principles

- **Mobile-First:** Every layout must feel native on iOS/Android (375px–430px). Tablet and desktop are secondary but must be fully responsive.
- **Distraction-Free Lesson Loop:** The global navigation is hidden during active lesson stages. Full focus on content.
- **Visual Pedagogy:** Colors carry semantic meaning (new vocab, correct/incorrect, Portuguese Bridge). Never use color purely for aesthetics inside lesson content.
- **Tap-Friendly Typography:** Lesson body text must be at least 18px on mobile. Individual words must have enough tap-target space for the Click-to-Translate feature.

---

## 2. Color Palette

### CSS Variables (add to `tailwind.config.ts` or `globals.css`)

```css
:root {
  /* Backgrounds */
  --color-bg:            #FAFAF7; /* warm off-white — primary app background */
  --color-surface:       #FFFFFF; /* card/modal surfaces */
  --color-surface-raised:#F4F3EF; /* elevated cards, lesson stages */

  /* Brand */
  --color-primary:       #1D5ED4; /* CTA buttons, progress bars, links */
  --color-primary-light: #EBF3FF; /* primary tinted backgrounds */
  --color-primary-dark:  #1648A8; /* hover/active state */

  /* Pedagogical — do not use these for generic UI */
  --color-vocab:         #D97706; /* amber — new vocabulary highlight */
  --color-vocab-bg:      #FEF3C7; /* amber tint — word highlight backgrounds */
  --color-bridge:        #6B7280; /* slate-gray — Portuguese Bridge text */
  --color-bridge-bg:     #F3F4F6; /* gray tint — bridge card background */

  /* Feedback */
  --color-success:       #059669; /* correct answer, streak, completed */
  --color-success-bg:    #D1FAE5;
  --color-error:         #DC2626; /* wrong answer, mistake */
  --color-error-bg:      #FEE2E2;

  /* Text */
  --color-text-primary:  #1C1917; /* warm near-black */
  --color-text-secondary:#57534E; /* body copy, secondary labels */
  --color-text-muted:    #A8A29E; /* captions, placeholders */
  --color-text-inverse:  #FFFFFF; /* text on dark backgrounds */

  /* Border */
  --color-border:        #E7E5E0; /* subtle card borders */
  --color-border-strong: #C7C4BE; /* form inputs, dividers */
}

/* Dark Mode */
.dark {
  --color-bg:            #111827;
  --color-surface:       #1F2937;
  --color-surface-raised:#374151;

  --color-primary:       #3B82F6;
  --color-primary-light: #1E3A5F;
  --color-primary-dark:  #60A5FA;

  --color-vocab:         #FBBF24;
  --color-vocab-bg:      #3D2E00;
  --color-bridge:        #9CA3AF;
  --color-bridge-bg:     #1F2937;

  --color-success:       #10B981;
  --color-success-bg:    #064E3B;
  --color-error:         #F87171;
  --color-error-bg:      #450A0A;

  --color-text-primary:  #F9FAFB;
  --color-text-secondary:#D1D5DB;
  --color-text-muted:    #6B7280;
  --color-text-inverse:  #111827;

  --color-border:        #374151;
  --color-border-strong: #4B5563;
}
```

### Tailwind Config Extension

```ts
// tailwind.config.ts
extend: {
  colors: {
    brand: {
      primary:       'var(--color-primary)',
      'primary-light': 'var(--color-primary-light)',
      'primary-dark':  'var(--color-primary-dark)',
    },
    vocab:   { DEFAULT: 'var(--color-vocab)', bg: 'var(--color-vocab-bg)' },
    bridge:  { DEFAULT: 'var(--color-bridge)', bg: 'var(--color-bridge-bg)' },
    success: { DEFAULT: 'var(--color-success)', bg: 'var(--color-success-bg)' },
    error:   { DEFAULT: 'var(--color-error)',   bg: 'var(--color-error-bg)'   },
  }
}
```

### Pedagogical Color Usage Rules

| Color | Token | Used For | Never Use For |
|---|---|---|---|
| Amber | `vocab` | New vocabulary word highlights in dialogue | Generic emphasis |
| Slate-gray | `bridge` | Portuguese Bridge explanation text | Regular body text |
| Emerald | `success` | Correct answer state, streak counters | Any decorative purpose |
| Red | `error` | Wrong answer state, error correction marker | Warnings or notices |
| Blue | `primary` | CTA buttons, progress bars, active state | Vocabulary highlights |

---

## 3. Typography

**Font Pairing:**
- **Headings (Display):** `Fraunces` — a variable serif with optical size axis. Warm, editorial, distinctive. Used for lesson titles, module names, and the app logo.
- **UI / Body:** `DM Sans` — clean, geometric, excellent small-size legibility. Used for all UI labels, body copy, exercise instructions, and dialogues.

```html
<!-- In layout.tsx or globals.css -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap" rel="stylesheet">
```

```css
/* globals.css */
:root {
  --font-display: 'Fraunces', Georgia, serif;
  --font-body:    'DM Sans', system-ui, sans-serif;
}
```

### Type Scale

| Role | Element | Size (mobile) | Size (desktop) | Weight | Font |
|---|---|---|---|---|---|
| App title / Module name | `h1` | 28px / `text-3xl` | 36px / `text-4xl` | 700 | Fraunces |
| Lesson title | `h2` | 22px / `text-2xl` | 28px / `text-3xl` | 600 | Fraunces |
| Exercise instruction | `h3` | 18px / `text-lg` | 20px / `text-xl` | 600 | DM Sans |
| Dialogue / story body | `p` (lesson) | 18px / `text-lg` | 18px | 400 | DM Sans |
| UI body / labels | `p` | 15px / `text-base` | 15px | 400 | DM Sans |
| Portuguese Bridge text | `small` | 14px | 14px | 400 italic | DM Sans |
| Captions / metadata | `small` | 13px / `text-sm` | 13px | 400 | DM Sans |

```css
/* Key rules */
.lesson-text { font-size: 18px; line-height: 1.7; }   /* comfortable reading */
.bridge-text { font-size: 14px; color: var(--color-bridge); font-style: italic; }
```

---

## 4. Spacing & Layout

Use Tailwind's default spacing scale throughout. Key conventions:

| Context | Rule |
|---|---|
| Mobile screen padding | `px-4 py-6` (16px / 24px) |
| Card internal padding | `p-4` or `p-5` |
| Section vertical gap | `gap-4` or `gap-6` |
| Bottom sticky button clearance | `pb-24` on scrollable content |
| Max content width (desktop) | `max-w-lg mx-auto` (lesson player stays narrow) |

**Layout pattern for lesson screens:**
```
┌──────────────────────────┐  <- full screen
│  LessonProgressHeader    │  h-14, sticky top
├──────────────────────────┤
│                          │
│   Lesson Content Area    │  flex-1, overflow-y-auto, px-4 pb-24
│                          │
└──────────────────────────┘
│   CheckButton (sticky)   │  fixed bottom-0, full-width, h-16
└──────────────────────────┘
```

---

## 5. Component Patterns

### Cards

```
shadow-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4
```

- Grammar Bridge cards: add left border `border-l-4 border-l-[var(--color-bridge)]`
- Vocabulary cards: add left border `border-l-4 border-l-[var(--color-vocab)]`
- Success state cards: `bg-success-bg border-success`
- Error state cards: `bg-error-bg border-error`

### Buttons

**Primary (CTA / CheckButton):**
```
bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]
text-white font-semibold rounded-2xl px-6 py-4
transition-all duration-150 active:scale-95
```

**Disabled:**
```
bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]
cursor-not-allowed
```

**Correct Answer (after submit):**
```
bg-success text-white
```

**Incorrect Answer (after submit):**
```
bg-error text-white
```

### Word Highlight (New Vocabulary)

```jsx
// ClickableWord — isNewVocabulary=true
<span className="
  text-[var(--color-vocab)]
  bg-[var(--color-vocab-bg)]
  px-1 rounded
  cursor-pointer
  underline decoration-dotted decoration-[var(--color-vocab)]
  hover:bg-amber-200 transition-colors duration-150
">
  {word}
</span>
```

### Progress Bar

```jsx
<div className="h-2 bg-[var(--color-surface-raised)] rounded-full overflow-hidden">
  <div
    className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500 ease-out"
    style={{ width: `${progress}%` }}
  />
</div>
```

---

## 6. Interactions & Animations

### Principles
- Animations should feel responsive, not showy. Maximum duration for UI transitions: 200ms.
- Reward animations (correct answer) can go up to 500ms with a bounce curve.
- No looping animations on static content — motion only responds to user action.

### Key Animation Patterns

**Button press (all interactive elements):**
```css
transition: transform 150ms ease, background-color 150ms ease;
active:scale-95
```

**Click-to-Translate Tooltip (fade-in + scale-up):**
```css
@keyframes tooltip-enter {
  from { opacity: 0; transform: scale(0.92) translateY(4px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.tooltip { animation: tooltip-enter 150ms ease forwards; }
```

**Correct Answer Celebration (bounce):**
```css
@keyframes correct-bounce {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.12); }
  70%  { transform: scale(0.95); }
  100% { transform: scale(1); }
}
.correct { animation: correct-bounce 400ms cubic-bezier(0.34, 1.56, 0.64, 1); }
```

**Lesson stage transition (slide-up):**
```css
@keyframes stage-enter {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.stage { animation: stage-enter 200ms ease forwards; }
```

**Word pill (SentenceBuilder) drop:**
```css
transition: transform 150ms ease, box-shadow 150ms ease;
/* On drag: */ transform: scale(1.05); box-shadow: shadow-lg;
```

---

## 7. Iconography

Use **Lucide React** for all icons. Size conventions:

| Context | Size | Class |
|---|---|---|
| In-text icons (inline) | 16px | `size-4` |
| Button icons | 20px | `size-5` |
| Feature icons (cards) | 24px | `size-6` |
| Audio play button | 28px | `size-7` |
| Empty state illustrations | 48px | `size-12` |

---

## 8. Responsive Breakpoints

```
Mobile (primary):  375px – 430px   → all default styles
Tablet:            640px (sm)      → increase padding, 2-col vocab grids
Desktop:           1024px (lg)     → max-w-lg lesson player centered, sidebar nav visible
```

Global navigation (bottom tab bar on mobile, sidebar on desktop):
```css
/* Mobile: fixed bottom bar */
@media (max-width: 639px) { nav { position: fixed; bottom: 0; width: 100%; } }
/* Desktop: fixed left sidebar */
@media (min-width: 1024px) { nav { position: fixed; left: 0; top: 0; height: 100%; width: 240px; } }
```

---

## 9. Dark Mode

Dark mode is toggled via a `dark` class on `<html>`. All CSS variables switch automatically (see Section 2). Components should use CSS variable tokens — **never hardcode hex values**.

```tsx
// In a ThemeToggle component
document.documentElement.classList.toggle('dark');
```

In Tailwind, add `darkMode: 'class'` to `tailwind.config.ts`.
