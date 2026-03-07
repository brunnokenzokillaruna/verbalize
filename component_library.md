# Component Library

This document outlines the core reusable UI components needed for the Verbalize application. Components should be built using React and styled with Tailwind CSS, prioritizing a mobile-first approach.

## 1. Typography & Text Components

### `ClickableWord`
- **Purpose:** Wraps individual words in a sentence. When clicked, it opens the translation tooltip.
- **Props:** `word`, `language`, `isNewVocabulary` (applies highlight color).

### `TranslationTooltip` (Click-to-Translate Feature)
- **Purpose:** A popover/tooltip that appears when clicking a word.
- **Elements:**
  - Portuguese translation
  - Short explanation
  - Audio play button
  - Example sentence

### `GrammarBridgeCard`
- **Purpose:** Displays the grammar explanation comparing the target language to Portuguese.
- **Elements:** Rule text, Target Example, Portuguese Comparison.

## 2. Media & Interactive Components

### `AudioPlayerButton`
- **Purpose:** A clean, accessible button to play pronunciation audio.
- **Props:** `audioUrl`, `autoPlay`.

### `VisualVocabCard`
- **Purpose:** Displays vocabulary with an associated Pexels image.
- **Elements:** Image (Next/Image), Title (Target word), Subtitle (Portuguese), Audio Button.

## 3. Exercise Components

### `DictationInput`
- **Purpose:** For the "Audio Dictation" exercise. Includes an audio play button and a text input field.

### `SpeechRecorder`
- **Purpose:** For the "Speak & Repeat" exercise. Connects to browser speech recognition.
- **Elements:** Microphone toggle button, visualizer (optional), feedback text.

### `SentenceBuilder`
- **Purpose:** Draggable or clickable word blocks to form a correct sentence.
- **Elements:** Bank of word pills, target dropzone/assembly area.

### `ConjugationTable`
- **Purpose:** For the "Verb Conjugation Drill". A grid/table displaying pronouns and input fields for missing verb forms.

### `ImageMatchGrid`
- **Purpose:** A 2x2 or 3x2 grid of images to match with a given vocabulary word.

### `ContextChoiceExercise`
- **Purpose:** For the "Context Choice" exercise. Displays a sentence with a blank and 3–4 word/phrase options to choose from.
- **Elements:** Prompt sentence, option buttons (tappable pills), submit button.
- **States:** Unselected, Selected (highlighted), Correct (green), Incorrect (red).

### `ErrorCorrectionExercise`
- **Purpose:** For the "Error Correction" exercise. Displays a sentence containing a deliberate mistake. The user must tap the wrong word and type the correction.
- **Elements:** ClickableWord sentence (mistake word is secretly flagged), editable correction input, feedback panel.

### `ReverseTranslationInput`
- **Purpose:** For the "Reverse Translation" exercise. Displays a Portuguese sentence; user types the translation in the target language.
- **Elements:** Portuguese source sentence, free-text input, character-by-character hint option.

### `VerbConjugationDrill`
- **Purpose:** For the "Verb Conjugation Drill" exercise. Displays a conjugation table with some cells blank for the user to complete.
- **Elements:** Pronoun column (read-only), conjugation cells (mix of read-only and editable inputs), verb title.

## 4. Verb Explorer Components

### `VerbSearchBar`
- **Purpose:** Search input to find verbs by infinitive. Filters the `verbs` Firestore collection.
- **Props:** `language`, `onSearch`.

### `VerbCard`
- **Purpose:** Compact card in the Verb Explorer list showing an infinitive, translation, and a badge if the user already learned it.
- **Props:** `verb` (VerbDocument), `isLearned`.

### `ConjugationTable`
- **Purpose:** Full conjugation table for a selected verb. Shows all tenses in expandable sections.
- **Elements:** Tense section headers, pronoun + conjugated form rows, example sentences per tense.

## 5. Onboarding Components

### `OnboardingStepLayout`
- **Purpose:** Wrapper for each onboarding step. Consistent layout with step indicator, title, subtitle, and a forward CTA.
- **Props:** `currentStep`, `totalSteps`, `title`, `subtitle`, `children`.

### `LanguageSelectCard`
- **Purpose:** Large tappable card for selecting the target language (French or English) during onboarding.
- **Props:** `language`, `flag`, `description`, `isSelected`.

### `InterestTagPicker`
- **Purpose:** Grid of tappable tags for the user to select personal interests during onboarding. Allows multi-select.
- **Props:** `options`, `selected`, `onChange`.

## 6. Lesson Navigation

### `LessonProgressHeader`
- **Purpose:** Top bar showing the user's progress through the 5 stages of a lesson (Hook, Grammar, Vocab, Practice, Review).
- **Elements:** Progress bar (stage-based), exit button, stage label.

### `NextButton` / `CheckButton`
- **Purpose:** Primary call-to-action to check an answer or proceed to the next slide. Sticky to the bottom of the screen on mobile.
- **States:** Default, Disabled, Correct (green), Incorrect (red with shake animation).

## 7. Dashboard Components

### `StreakCounter`
- **Purpose:** Displays the user's current daily streak with a flame icon.
- **Props:** `currentStreak`, `lastCompletedDate`.

### `VocabProgressCard`
- **Purpose:** Summary card showing total words learned, broken down by language and SRS level.

### `ModuleProgressBar`
- **Purpose:** Shows how far the user has progressed through a curriculum module (e.g., A1 French: 12/30 lessons).
- **Props:** `module`, `completedCount`, `totalCount`.
