# Verbalize

## Overview
Verbalize is a language learning application designed to teach French and English to Brazilian Portuguese speakers in a clear, intuitive, and contextual way.

The goal of the app is to make language learning simple and engaging by combining:
- Micro-stories
- Conversational dialogues
- Visual learning
- Grammar explanations
- Interactive exercises
- Spaced repetition review

The application uses Portuguese as a pedagogical bridge, helping users understand grammar and vocabulary by comparing structures between languages.

Verbalize was initially created as a personal project for family and friends but is architected to allow future expansion.

## Pedagogical Principles

### Portuguese Bridge Method
Brazilian learners often understand new grammar faster when it is compared directly to Portuguese.

**Example:**
- **French:** *Je suis en train de manger*
- **Explanation:** *être en train de* + verb
- **Portuguese comparison:** *Estou comendo*

The system frequently highlights structural similarities and differences.

### Narrative Grammar
Grammar explanations are short and integrated into the learning context.

**Structure:**
1. Short explanation
2. Examples
3. Practice

The goal is understanding instead of memorization.

### Context-Based Learning
Users learn through small stories and realistic scenarios rather than isolated words.

**Examples:**
- Ordering food
- Introducing yourself
- Work conversations
- Traveling
- Casual interactions

This approach improves retention and comprehension.

### Micro Learning
Each lesson is designed to take approximately 5–10 minutes. This supports daily consistency without overwhelming the learner.

## Supported Languages

### French Learning Focus
The French curriculum prioritizes areas that are typically difficult for Portuguese speakers:
- Pronunciation and nasal vowels
- Liaison and spoken rhythm
- Gender rules
- Sentence structure
- Essential verbs
- Differences between formal and conversational French

Special emphasis is placed on listening and pronunciation.

### English Learning Focus
The English curriculum focuses on natural spoken usage:
- Phrasal verbs
- Collocations
- Idiomatic expressions
- Conversational English

The objective is to help users sound natural and fluent, not just grammatically correct.

## Lesson Structure

Every lesson contains five stages.

### 1. Hook
A short micro-dialogue or 2–3 contextual sentences.

**Example:**
> **Marie:** Tu veux manger quelque chose ?  
> **Paul:** Oui, j'ai très faim.  
> **Marie:** On peut aller au café.

New vocabulary is highlighted using a different color.

### 2. Grammar Bridge
A short explanation of a grammar pattern that appeared in the dialogue.

**Example:**
> "Tu veux" means "you want".  
> In informal French we use "tu".  
> Portuguese usually uses "você".

The explanation always references Portuguese.

### 3. Visual Vocabulary Input
New vocabulary is presented with:
- Image
- Audio pronunciation
- Translation
- Example sentence

This reinforces memory using visual association.

### 4. Practice
Users complete interactive exercises to reinforce the lesson.
Exercises are generated only using vocabulary the learner has already studied.

### 5. Spaced Review
A short review session revisiting older vocabulary using spaced repetition.
The system prioritizes items the learner previously answered incorrectly.

## Progressive Micro Stories
Stories grow more complex as the learner improves.

- **Beginner level:** Short sentences
  - *Example:* Bonjour. Je m'appelle Marie. Je travaille ici.
- **Intermediate level:** Short conversations
- **Advanced level:** Longer conversations and situational dialogues

These simulate real-world communication scenarios such as:
- Meeting someone
- Ordering food
- Job conversations
- Travel situations

## User Personalization
During the first login, the user provides basic information:
- Name
- Profession
- Personal interests
- Language goals

This information helps the AI personalize some examples and dialogues.
However, lessons are not restricted only to the user’s interests, ensuring broad vocabulary exposure.

## Core Features

### Click-to-Translate Feature
Users can click any word or phrase to instantly view:
- Portuguese translation
- Explanation
- Pronunciation audio
- Example sentence

This helps learners understand new words without interrupting the learning flow.

### Visual Learning System
Images are used to reinforce vocabulary learning.
The system integrates with the Pexels API.

**Image retrieval workflow:**
1. Check local cache
2. If image not found
3. Query Pexels API
4. Store image URL in database

#### Image Keyword Engineering
To avoid visual ambiguity, search keywords must be precise.

- **Poor example:** people eating dinner together
- **Better example:** person eating food isolated

**Guidelines:**
- Focus on a single object or action
- Avoid complex scenes
- Prefer neutral backgrounds
- Prefer single subject

This ensures the visual meaning is clear.

### Vocabulary Tracking
All learned vocabulary is stored in the database.

**Collection example:** `user_vocabulary`

**Fields:**
- `uid`
- `language`
- `word`
- `translation`
- `firstSeen`
- `lastReview`
- `srsLevel`

Exercises and reviews use only previously learned vocabulary.

### Verb Explorer
The app includes a dedicated section for verbs.

**Features:**
- Searchable verb list
- Filter by language
- Conjugation tables
- Example sentences
- Highlight verbs the user already learned

## Responsive Design
The application is fully responsive. Mobile is the primary design target.

**Supported screen sizes:**
- Mobile
- Tablet
- Desktop

## Technology Stack
The project uses a stack that allows operation with zero cost.

- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** Firebase (Spark Plan), Firestore, Firebase Authentication
- **AI services:** Gemini 3.1 Flash-Lite Preview
- **Images:** Pexels API
- **Hosting:** Vercel free tier

## Exercise Types
The following exercise formats are supported.

### Audio Dictation
The learner listens to a sentence and writes what they hear.
- **Goal:** Improve listening and spelling accuracy.

### Speak & Repeat
The learner listens to a sentence and repeats it aloud. Speech recognition evaluates pronunciation.
- **Goal:** Improve speaking fluency.

### Sentence Builder
The learner constructs a sentence by arranging word blocks in the correct order.
- **Goal:** Understand sentence structure.

### Context Choice
The learner chooses the correct word or phrase depending on the context.
- **Goal:** Develop nuance recognition.

### Verb Conjugation Drill
The learner completes missing forms in a verb conjugation table.
- **Goal:** Strengthen verb conjugation recall.

### Error Correction
The learner receives a sentence containing a mistake and must correct it.
- **Goal:** Develop grammar awareness.

### Reverse Translation
The learner translates a sentence from Portuguese to the target language.
- **Goal:** Active language production.

### Image Match
The learner matches an image with the correct word.
- **Goal:** Strengthen visual vocabulary association.

## Project Folder Structure
```text
app/
components/
features/
hooks/
services/
store/
types/
utils/
docs/
prompts/
rules/
```