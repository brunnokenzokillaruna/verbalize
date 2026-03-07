# Database Model (Firestore)

Verbalize uses Firebase Firestore, a NoSQL database. Operations should be optimized to minimize document reads to stay within the Spark (Free) plan limits.

## 1. `users` Collection
Stores user profiles and personalization data.
```typescript
interface UserDocument {
  uid: string; // Firebase Auth UID
  email: string;
  name: string;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  
  // Personalization
  profession: string;
  interests: string[];
  languageGoals: string;
  currentTargetLanguage: 'fr' | 'en';
  
  // High-level stats
  currentStreak: number;
  totalLessonsCompleted: number;
}
```

## 2. `user_vocabulary` Collection
Tracks every word a user has learned for Spaced Repetition (SRS).
**Optimization Rule:** Use compound queries (e.g., `uid` + `language` + `nextReviewDate`) to fetch daily reviews efficiently.
```typescript
interface UserVocabularyDocument {
  id: string; // Auto-generated
  uid: string; // Reference to User
  language: 'fr' | 'en';
  
  word: string;
  translation: string;
  
  // SRS Data
  firstSeen: Timestamp;
  lastReview: Timestamp;
  nextReview: Timestamp;
  srsLevel: number; // e.g., 0-5 indicating memory strength
  mistakeCount: number;
}
```

## 3. `image_cache` Collection
Stores Pexels API image URLs to prevent redundant API calls and save quota.
```typescript
interface ImageCacheDocument {
  word: string; // Document ID (e.g., "apple_isolated")
  language: string;
  imageUrl: string;
  photographer: string; // For attribution if needed
  createdAt: Timestamp;
}
```

## 4. `lessons_completed` Collection (Optional / Analytics)
Logs completed lessons for history and streak tracking.
```typescript
interface LessonLogDocument {
  id: string;
  uid: string;
  language: 'fr' | 'en';
  lessonId: string; // References the curriculum episode number
  completedAt: Timestamp;
  score: number; // Percentage of exercises correct
}
```

## 5. `verbs` Collection (Static / Read-only)
Contains structured data for the Verb Explorer feature.
```typescript
interface VerbDocument {
  infinitive: string; // Document ID
  language: 'fr' | 'en';
  translation: string;
  
  // Nested conjugations based on tense
  conjugations: {
    present: Record<string, string>; // e.g., { "je": "suis", "tu": "es" }
    past: Record<string, string>;
    // ...
  };
  
  exampleSentences: Array<{
    target: string;
    portuguese: string;
  }>;
}
```
