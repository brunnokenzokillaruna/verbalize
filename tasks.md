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

## Phase 5: Lesson Engine ✅
- [x] `types/index.ts` — Extended with `LessonDefinition`, `Exercise` discriminated union, and 6 exercise data types.
- [x] `lib/curriculum.ts` — 10 French + 10 English lesson definitions (A1–A2), `getNextLesson()`.
- [x] `lib/srs.ts` — Simplified SM-2 spaced repetition: 6 levels, intervals [1, 3, 7, 14, 30, 90] days.
- [x] `store/lessonStore.ts` — Zustand lesson state machine (`idle → loading → hook → grammar → vocabulary → practice → complete`).
- [x] `app/actions/generatePracticeExercises.ts` — Gemini generates 2 exercises (context-choice + reverse-translation) in one call.
- [x] 5 exercise components (SpeechRecorder deferred to Phase 7):
  - `ContextChoiceExercise` — sentence-with-blank + 4 tappable option pills.
  - `SentenceBuilder` — click-to-order word bank + answer area (no DnD library).
  - `ReverseTranslationInput` — PT source card + free-text textarea + collapsible hint.
  - `DictationInput` — AudioPlayerButton + transcription input + collapsible translation hint.
  - `ErrorCorrectionExercise` — highlighted error word + correction input.
  - `VerbConjugationDrill` — pronoun/conjugation table with blank `<input>` cells.
- [x] `services/firestore.ts` — Added `upsertVocabularyItem` (SM-2 create/update) + `logLesson`.
- [x] `app/(app)/lesson/page.tsx` — Full lesson orchestrator: lazy stage loading, exercise loop, CheckButton integration, Firestore saves on complete.
- [x] `app/(app)/page.tsx` — Dashboard "Iniciar Lição" button navigates to `/lesson`.

## Phase 6: Vocabulary & Analytics ✅
- [x] `services/firestore.ts` — Added `getUserVocabulary`, `updateVocabTranslation`, `getCachedVerb`, `saveVerbCache`.
- [x] `app/actions/getVerbConjugation.ts` — Gemini on-demand verb conjugation with Firestore caching (`verbs/{infinitive}_{language}`).
- [x] `components/ui/BottomNav.tsx` — Fixed bottom nav (Home / Vocabulário / Verbos); auto-hides on `/lesson`.
- [x] `app/(app)/layout.tsx` — BottomNav added to all app routes.
- [x] `app/(app)/vocabulary/page.tsx` — Full vocabulary list: due-today vs learned sections, SRS level badges, lazy Gemini translation enrichment for placeholder words, audio buttons.
- [x] `app/(app)/verbs/page.tsx` — Verb Explorer: search input, quick-start chips, Gemini-powered conjugation table with collapsible tenses, per-form audio, example sentences.
- [x] Dashboard — `pb-24` bottom padding for nav clearance.

## Phase 7: Polish & Deployment
- [ ] Ensure mobile responsiveness across all device sizes.
- [ ] Implement Dark Mode support.
- [ ] Deploy to Vercel (connect GitHub repository, set environment variables).
- [ ] Test Firebase security rules (ensure users can only read/write their own data).
