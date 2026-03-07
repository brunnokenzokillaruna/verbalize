# Development Tasks & Roadmap

This document outlines the step-by-step implementation plan for the Verbalize application.

## Phase 1: Project Setup & Foundation ✅
- [x] Initialize Next.js project with App Router, TypeScript, and Tailwind CSS.
- [x] Configure ESLint, Prettier, and absolute imports.
- [x] Set up Firebase SDK (Auth & Firestore services) — add real keys to `.env.local`.
- [x] Create basic folder structure (`components`, `features`, `lib`, `services`, `hooks`, `store`, `types`, `utils`).
- [x] Define Tailwind v4 configuration (CSS variables, fonts via `next/font`, dark mode class).

## Phase 2: Authentication & Onboarding
- [ ] Implement Firebase Authentication (Email/Password & Google Sign-In).
- [ ] Build Onboarding Flow:
  - Collect user name, profession, interests.
  - Select target language (French or English).
- [ ] Save user profile data to Firestore `users` collection.

## Phase 3: Core UI Components
- [ ] Build `ClickableWord` and `TranslationTooltip` components.
- [ ] Build `LessonProgressHeader` and sticky bottom `CheckButton`.
- [ ] Build `GrammarBridgeCard` and `VisualVocabCard`.

## Phase 4: AI & External API Integration
- [ ] Integrate Gemini API.
  - Write server actions to generate the "Hook" stories based on the curriculum.
  - Write server actions to generate Grammar Bridges.
- [ ] Integrate Pexels API.
  - Create the caching logic (check Firestore `image_cache` -> fetch Pexels -> save to Firestore).
- [ ] Set up Text-to-Speech (TTS) for audio pronunciation (Browser native SpeechSynthesis or free tier cloud TTS).

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
