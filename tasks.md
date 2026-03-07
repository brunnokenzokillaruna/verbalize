# Development Tasks & Roadmap

This document outlines the step-by-step implementation plan for the Verbalize application.

## Phase 1: Project Setup & Foundation ✅
- [x] Initialize Next.js project with App Router, TypeScript, and Tailwind CSS.
- [x] Configure ESLint, Prettier, and absolute imports.
- [x] Set up Firebase SDK (Auth & Firestore services) — add real keys to `.env.local`.
- [x] Create basic folder structure (`components`, `features`, `lib`, `services`, `hooks`, `store`, `types`, `utils`).
- [x] Define Tailwind v4 configuration (CSS variables, fonts via `next/font`, dark mode class).

## Phase 2: Authentication & Onboarding ✅
- [x] Implement Firebase Authentication (Email/Password & Google Sign-In).
- [x] Build Onboarding Flow (4 steps):
  - Step 1: Name
  - Step 2: Profession + language goal
  - Step 3: Interests (multi-select grid)
  - Step 4: Target language selection (French or English)
- [x] Save user profile data to Firestore `users` collection.
- [x] Zustand auth store + `AuthProvider` (syncs Firebase auth state globally).
- [x] Route guards: `(app)/layout.tsx` redirects unauthenticated/non-onboarded users.
- [x] Reusable UI components: `Button`, `Input`.
- [x] `lib/env.ts` — server-side env validation with security documentation.
- [x] Editorial split-layout login/signup pages (desktop) with floating word texture.

## Phase 3: Core UI Components ✅
- [x] `hooks/useAudio.ts` — browser SpeechSynthesis hook (speak/stop/toggle, rate 0.85).
- [x] `AudioPlayerButton` — circular play button with pulsing ring animation (sm/md/lg sizes).
- [x] `ClickableWord` — amber vocab highlight, ripple on click, fires `onWordClick` payload.
- [x] `ClickableSentence` — tokenizes text into clickable words + non-clickable punctuation.
- [x] `TranslationTooltip` — bottom sheet (slides up), backdrop blur, skeleton loading, body scroll lock.
- [x] `LessonProgressHeader` — 5-segment pill progress bar with exit button + stage label.
- [x] `CheckButton` — idle/disabled/correct/incorrect states, result feedback banner, answer reveal.
- [x] `GrammarBridgeCard` — left-border accent, target/Portuguese comparison rows.
- [x] `VisualVocabCard` — image-first with gradient overlay, placeholder emoji, audio button.
- [x] `app/(app)/preview/page.tsx` — living component showcase with interactive demo data.

## Phase 4: AI & External API Integration ✅
- [x] `services/gemini.ts` — `callGemini` + `callGeminiJSON` REST client (no SDK, native fetch, `gemini-2.0-flash-lite`).
- [x] `services/pexels.ts` — `searchPexels` with edge revalidation (1h cache).
- [x] `app/actions/translateWord.ts` — Gemini Prompt #5; powers click-to-translate bottom sheet.
- [x] `app/actions/generateHook.ts` — Gemini Prompt #1; generates personalized dialogue + vocabulary list.
- [x] `app/actions/generateGrammarBridge.ts` — Gemini Prompt #2; outputs `GrammarBridgeCard` props directly.
- [x] `app/actions/getVocabImage.ts` — Firestore cache → Gemini keyword → Pexels → save cache pipeline.
- [x] Wired `translateWord` into `/preview` page (real Gemini call on word click).
- [x] Set up Text-to-Speech (TTS) — browser native SpeechSynthesis via `useAudio` hook (done in Phase 3).

## Phase 5: Lesson Engine
- [ ] Build the Lesson State Machine (Hook -> Grammar -> Vocab -> Practice -> Review).
- [ ] Implement Exercise Types:
  - Context Choice (`ContextChoiceExercise`)
  - Sentence Builder (`SentenceBuilder`)
  - Image Match (`ImageMatchGrid`)
  - Audio Dictation (`DictationInput`) — user listens and types what they hear
  - Speak & Repeat (`SpeechRecorder`) — browser SpeechRecognition API
  - Error Correction (`ErrorCorrectionExercise`) — tap incorrect word, type fix
  - Reverse Translation (`ReverseTranslationInput`) — PT → target language
  - Verb Conjugation Drill (`VerbConjugationDrill`) — fill blank table cells
- [ ] Implement Spaced Repetition (SRS) logic (calculate `nextReview` dates).

## Phase 6: Vocabulary & Analytics
- [ ] Build the "Verb Explorer" screen with searchable conjugation tables.
- [ ] Build the User Dashboard:
  - Display daily streak.
  - Show learned vocabulary list.
  - Show progress through the curriculum modules.

## Phase 7: Polish & Deployment
- [ ] Ensure mobile responsiveness across all device sizes.
- [ ] Implement Dark Mode support.
- [ ] Deploy to Vercel (connect GitHub repository, set environment variables).
- [ ] Test Firebase security rules (ensure users can only read/write their own data).
