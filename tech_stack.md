# Technology Stack

Verbalize is built entirely on a zero-cost, serverless stack optimized for rapid development and high performance.

## Frontend
- **Framework:** [Next.js v15.x (App Router)](https://nextjs.org/) - React framework for server-rendered and statically generated applications.
- **Language:** [TypeScript v5.x](https://www.typescriptlang.org/) - For type safety and better developer experience.
- **Library:** [React v19.x](https://react.dev/) - Core UI library.
- **Styling:** [Tailwind CSS v3.4+](https://tailwindcss.com/) - Utility-first CSS framework for rapid UI development.
- **Icons:** [Lucide React v0.4+ ](https://lucide.dev/) or [Heroicons v2.x](https://heroicons.com/) - Lightweight SVGs.
- **State Management:** React Context (for auth) & [Zustand v5.x](https://github.com/pmndrs/zustand) (for complex lesson state), or just standard React hooks.

## Backend & Database (BaaS)
- **Platform:** [Firebase SDK v10.x+](https://firebase.google.com/) (Spark Free Plan)
- **Database:** Firestore (NoSQL document database) for storing user data, vocabulary, and image caching.
- **Authentication:** Firebase Auth (Email/Password, Google OAuth).

## AI & Third-Party Services
- **Generative TextAI:** [Google Gemini API (@google/genai)](https://ai.google.dev/) (Model: Gemini 3.1 Flash-Lite Preview) - Used for dynamic dialogue generation, personalized sentences, and Portuguese grammar bridges.
- **Image Retrieval:** [Pexels API](https://www.pexels.com/api/) (Free) - Used for fetching visual vocabulary associations based on keyword engineering.
- **Audio (Text-to-Speech):** Browser Native `SpeechSynthesis` API OR free tier TTS services (like Google Cloud Text-to-Speech free limits) for generating pronunciation.

## Hosting & CI/CD
- **Environment:** Node.js v20+ (LTS)
- **Web Hosting:** [Vercel](https://vercel.com/) (Hobby/Free Tier) - Seamless Next.js deployment, edge functions, and automatic HTTPS.
- **Version Control:** Git / GitHub

## Rationale
This stack allows Verbalize to scale effectively to a small/medium user base (family and friends) without incurring any cloud hosting, API, or database costs, aligning perfectly with the project's requirements.
