---
name: Verbalize
description: Interactive and tactile language learning platform powered by high-fidelity audio and rich 3D feedback
colors:
  primary: "#1d5ed4"
  primary-light: "#ebf3ff"
  primary-dark: "#1648a8"
  vocab: "#d97706"
  vocab-bg: "#fef3c7"
  verb: "#7c3aed"
  verb-bg: "#f3e8ff"
  bridge: "#6b7280"
  bridge-bg: "#f3f4f6"
  success: "#059669"
  success-bg: "#d1fae5"
  error: "#dc2626"
  error-bg: "#fee2e2"
  warning: "#b45309"
  warning-bg: "#fff4e5"
  text-primary: "#1c1917"
  text-secondary: "#57534e"
  text-muted: "#a8a29e"
  bg: "#fafaf7"
  surface: "#ffffff"
  surface-raised: "#f4f3ef"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(2.25rem, 5vw, 4rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.7
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-dark}"
  card-interactive:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: Verbalize

## 1. Overview

**Creative North Star: "The Tactile Dialog Workshop"**

Verbalize is a premium, interactive language-learning sanctuary. It rejects the cold, flat, gray aesthetics of generic software tools in favor of a warm, rich, physical workspace. Every interactive element possesses visual weight and dimensional presence, rewarding actions with immediate physical feedback, micro-animations, and high-fidelity sonic reinforcement. 

The system transitions seamlessly between light and dark modes, utilizing a warm paper baseline in light mode (`#fafaf7`) and a deep slate ink baseline in dark mode (`#111827`). Spacing and padding are generous, ensuring focus and visual breathability.

**Key Characteristics:**
- **Tactile Dimensions**: Buttons and chips feel physical, using subtle bottom borders (3D press effects) and scale transitions.
- **Dynamic Physics**: Orchestrated springs and micro-shakes bring correct and incorrect answers to life.
- **Editorial Contrast**: Sophisticated serif display headers paired with clean, accessible sans-serif body typography.

## 2. Colors

The color palette is split into a robust functional set and semantic accents that highlight specific pedagogical roles (vocabulary, verbs, translation bridges).

### Primary
- **Active Cobalt** (`#1d5ed4`): Used for high-priority interactive components, progress states, and key navigational focus.
- **Cobalt Light** (`#ebf3ff`): Background tint for focused exercises and active highlights.
- **Cobalt Dark** (`#1648a8`): The solid 3D depth color and hover-state baseline.

### Neutral
- **Warm Paper** (`#fafaf7`): The foundational light-mode background. Feel natural, cozy, and highly legible.
- **Ink Obsidian** (`#1c1917`): High-contrast primary text color for light mode.
- **Slate Gray** (`#57534e`): Muted ink for secondary labels and secondary contextual help.
- **Clay Border** (`#e7e5e0`): Base border color separating exercise panels and progress indicators.

### Accents (Pedagogical Roles)
- **Amber Vocabulary** (`#d97706`): Highlights noun and vocabulary cards/chips.
- **Purple Verb** (`#7c3aed`): Highlights action verbs and conjugations.
- **Bridge Gray** (`#6b7280`): Marks auxiliary translations, hints, and instructional context.

### Named Rules
**The Accent Rarity Rule.** Accents (Amber and Purple) must never dominate more than 15% of a given screen. They are reserved strictly for isolating vocabulary and verb types to optimize visual scanning during active exercises.

## 3. Typography

**Display Font:** Fraunces (serif fallback Georgia)
**Body Font:** DM Sans (sans-serif fallback system-ui)

The pairing bridges classical literature and editorial excellence with modern, pixel-perfect screen performance.

### Hierarchy
- **Display** (Bold 700, clamp(2.25rem, 5vw, 4rem), 1.1): Used for main page titles, lesson headlines, and milestone announcements.
- **Headline** (Semi-Bold 600, 1.75rem, 1.2): Section level indicators and dashboard progress groups.
- **Body** (Regular 400, 18px, 1.7): Optimized for reading full sentences inside exercises (`.lesson-text`). Max line length capped at 70ch.
- **Label** (Medium 500, 14px, 1.0): Button texts, chips, tags, and small meta information.

### Named Rules
**The Sentence Rhythm Rule.** Exercise texts must use a line-height of exactly `1.7` (`.lesson-text`) to allow pronunciation markers and translate hints to sit cleanly between lines without clipping.

## 4. Elevation

Verbalize avoids heavy drop shadows as mere decorations. Instead, depth is conveyed through tonal borders, 3D vertical offsets (3D presses), and physical state reactions.

### Named Rules
**The Tactile Spring Rule.** Surfaces are flat or shallow at rest with a 1px border. Shadows appear only on hover or focus to signify lift. Active clicks must shift elements downwards by 2px to 4px to simulate physical buttons.

## 5. Components

### Buttons

- **Shape:** Softly curved corners (`rounded.md` / 12px)
- **Primary (3D Press):** Styled with `.duo-cta`, utilizing a 4px bottom border representing dimensional depth.
- **Hover / Active:** Clicks trigger a down-shift (`translateY(2px)`) and compress the bottom border to simulate physical travel.

### Level / Exercise Chips
- **Style:** Light background tinted to its pedagogical role (e.g. Amber background for vocabulary chips), soft rounded borders.
- **State:** Active click triggers `.duo-level-chip:active`, producing a tactile 2px bounce.

### Cards / Containers
- **Corner Style:** Medium-high radius (`rounded.lg` / 16px).
- **Interactive Lift:** Cards on the dashboard apply `.card-lift`, elevating `3px` upward on hover with a soft ambient shadow.

## 6. Do's and Don'ts

### Do:
- **Do** use strict WCAG AA contrast (≥4.5:1) for all translation text. Ensure muted bridge text remains highly legible.
- **Do** pair `.animate-correct` with positive auditory feedback and `.animate-shake` with incorrect answers to give multisensory reassurance.
- **Do** limit display serif typography strictly to headings (`h1` through `h3`) and keep DM Sans for all instructions.

### Don't:
- **Don't** use generic, cold gray borders. Always use warm clay borders (`#e7e5e0`).
- **Don't** use flat, non-animated state changes on exercise choices. Active buttons must bounce or translate to reward interaction.
- **Don't** use side-stripe borders or neon text gradients. Design accents must rely purely on clean background shapes and text sizing.
