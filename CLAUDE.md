# Verbalize Agent Instructions

When assisting with the Verbalize application, please adhere to the following project constraints, architectural guidelines, and pedagogical principles.

## 1. Project Goal
Verbalize is a language learning app teaching French and English to Brazilian Portuguese speakers. It uses a comparative approach (Portuguese Bridge Method) and context-based micro-learning.

## 2. Technology Constraints (Zero-Cost Stack)
The project MUST operate at zero cost. When suggesting tools, libraries, or deployment strategies, strictly use the following:
- **Frontend Framework:** Next.js (React)
- **Styling:** Tailwind CSS (Vanilla utilities, avoid heavy component libraries unless necessary)
- **Backend & Database:** Firebase (Spark Plan) - Firestore for DB, Firebase Auth for authentication.
- **AI Services:** Google Gemini (Model: Gemini 3.1 Flash-Lite Preview)
- **Image Sourcing:** Pexels API
- **Web Hosting:** Vercel (Free Tier)

Do not suggest AWS, paid ChatGPT APIs, or relational databases that require monthly hosting fees.

## 3. UI/UX Principles
- **Mobile-First:** The primary design target is mobile. Tablet and Desktop are secondary but must be responsive.
- **Micro-Learning:** Interfaces should never feel cluttered. Lessons take 5-10 minutes. 
- **Colors & Highlighting:** Use specific text colors to highlight new vocabulary in a sentence. Don't rely solely on bold text.
- **Click-to-Translate:** Ensure text components are structured to allow click events on individual words for immediate translation and audio playback.

## 4. Code Structure
Follow the standard feature-based or domain-based folder structure:
- `app/`: Next.js App Router pages
- `components/`: Reusable UI components (buttons, modals, cards)
- `features/`: Complex domain-specific modules (e.g., `lesson-player`, `spaced-repetition`)
- `hooks/`: Custom React hooks (e.g., `useAuth`, `useAudio`)
- `services/`: API wrappers (Firebase, Pexels, Gemini)
- `store/`: State management (Zustand or Context)
- `types/`: TypeScript interfaces

## 5. Development Workflow
- Always optimize for fast page loads and minimal client-side bundle sizes.
- Handle API failures gracefully, especially prioritizing fallbacks for free-tier rate limits (e.g., Pexels or Gemini).
