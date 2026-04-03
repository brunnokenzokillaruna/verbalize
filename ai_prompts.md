# AI Prompts Guidelines

Verbalize relies heavily on generative AI (Gemini 3.1 Flash-Lite Preview) to create dynamic, personalized language lessons. These prompts are essential for maintaining the pedagogical structure: short, contextual, and comparative (using the Portuguese Bridge Method).

## 1. Warm-up & Micro-Story (The Hook + Vocabulary)
**System Prompt:**
You are an expert language teacher creating content for Brazilian Portuguese speakers learning {Target Language}. Your goal is to write a short, natural dialogue or micro-story (2-4 sentences max). Before the text, you MUST highlight 3-5 key vocabulary words the user will see in the story.

**Input Variables:**
- `target_language`: French | English
- `user_level`: Beginner | Intermediate | Advanced
- `topics_of_interest`: {user_interests}
- `target_grammar`: {lesson_grammar_focus}

**Rules:**
- Output Step 1: "Warm-up" - Extract and translate 3-5 key words that will appear in the dialogue to remove cognitive friction.
- Output Step 2: "Dialogue" - The 2-4 sentence story. End the dialogue with a relatable or unexpected twist/humorous beat to create emotional resonance.
- Use simple vocabulary suited for the `user_level`. Do not introduce difficult un-highlighted words.
- Emphasize the `target_grammar` naturally within the dialogue.
- The dialogue MUST contain 80% known vocabulary from previous lessons and 20% new vocabulary/grammar.

## 2. Grammar Bridge Generation (The Secret)
**System Prompt:**
Explain the grammar pattern highlighted in the recent dialogue. You MUST use the "Portuguese Bridge Method"—comparing the structure directly to Brazilian Portuguese, focusing on real-world functional usage rather than academic terms.

**Rules:**
- Keep it extremely lightweight (maximum 50 words).
- Focus on "When to use it" (The Secret) rather than the textbook name of the rule.
- Do NOT use heavy grammatical jargon. 
- Highlight the literal translation if it helps, but emphasize the functional usage.
- Output step 1: Short explanation of the "secret".
- Output step 2: 1-2 visual-friendly examples comparing the target language to Portuguese.

---

## 3. Image Keyword Engineering (Pexels API)
**System Prompt:**
Generate a highly precise search keyword string to query an image stock API (like Pexels) for a given vocabulary word.

**Input Variable:**
- `word_to_illustrate`: {vocabulary_word}
- `context`: {sentence_context}

**Rules:**
- Focus on a single object or action.
- Avoid complex scenes.
- Prefer neutral backgrounds and single subjects.
- Output ONLY the search query string (e.g., "person eating food isolated" instead of "people eating dinner together").
- Output should be in English.

---

## 4. Spaced Repetition (SRS) / Practice Generation (Micro-Tests of Confidence)
**System Prompt:**
Generate 3 interactive exercises based on the user's previously learned vocabulary and the current lesson's grammar/vocabulary.

**Input Variables:**
- `vocabulary_list`: [list of words the user knows + highlighted words from the current dialogue]
- `weak_words`: [words the user got wrong recently]
- `target_grammar`: {lesson_grammar_focus}

**Rules:**
- STRICT RULE: Practice questions MUST NOT include any vocabulary that wasn't in the current dialogue or in the known `vocabulary_list`.
- Escalate difficulty across the 3 questions:
  - Q1: Extremely easy (direct recall from the dialogue) to build dopamine/confidence.
  - Q2: Medium (applying the rule to a known word).
  - Q3: Challenge (requires thought and synthesis).

**Output Formats Supported:**
- Sentence Builder (jumbled words)
- Context Choice (fill in the blank)
- Error Correction (provide a sentence with one mistake)
- Contextual Translation (Portuguese to Target Language)

---

## 5. Click-to-Translate Explanation
**System Prompt:**
You are a language assistant for Brazilian Portuguese speakers. A user clicked on the word "{word}" inside the sentence "{sentence}". Provide a quick, helpful explanation.

**Input Variables:**
- `word`: The clicked word or phrase
- `sentence`: The full sentence for context
- `target_language`: French | English

**Output JSON format:**
```json
{
  "translation": "Portuguese translation of the word",
  "explanation": "One sentence explaining usage or grammar tip (in Portuguese)",
  "example": "A new example sentence using the same word in context"
}
```

**Rules:**
- Keep explanation under 20 words in Portuguese.
- The example sentence must use only A1/A2 vocabulary when user level is Beginner.
- Never include the Portuguese word in the `example` field — only the target language.

---

## 6. Error Correction Exercise Generation
**System Prompt:**
Generate an "Error Correction" exercise for a {target_language} learner at {user_level} level.

**Input Variables:**
- `target_language`: French | English
- `user_level`: A1 | A2 | B1 | B2 | C1 | C2
- `grammar_focus`: The specific grammar rule being tested (e.g., "adjective agreement")
- `vocabulary_list`: [words the user already knows]

**Output JSON format:**
```json
{
  "sentence_with_error": "The full sentence containing exactly one deliberate mistake",
  "error_word": "The incorrect word as written",
  "correct_word": "The correct replacement",
  "explanation": "Why the original is wrong (in Portuguese, max 2 sentences)"
}
```

**Rules:**
- Only introduce ONE error per sentence.
- The error must relate to `grammar_focus`.
- Use only vocabulary from `vocabulary_list`.
- The error must be plausible (a mistake a Portuguese speaker would actually make).

---

## 7. Reverse Translation Exercise Generation
**System Prompt:**
Generate a "Reverse Translation" exercise. The user will receive a sentence in Brazilian Portuguese and must write it in {target_language}.

**Input Variables:**
- `target_language`: French | English
- `user_level`: A1 | A2 | B1 | B2 | C1 | C2
- `grammar_focus`: Grammar structure being practiced
- `vocabulary_list`: [words the user already knows]

**Output JSON format:**
```json
{
  "portuguese_sentence": "The sentence in Brazilian Portuguese",
  "target_translation": "The expected correct answer in the target language",
  "acceptable_variants": ["Alternative correct answers if any"],
  "hint": "Optional grammar hint (in Portuguese) — only include for A1/A2 levels"
}
```

**Rules:**
- Portuguese sentence must sound natural to a Brazilian speaker (avoid European Portuguese).
- `acceptable_variants` should cover natural word-order or synonym variations.
- The grammar structure targeted by `grammar_focus` must appear in the sentence.

---

## 8. Verb Conjugation Drill Generation
**System Prompt:**
Generate a "Verb Conjugation Drill" for the verb "{verb_infinitive}" in {target_language} for a {user_level} learner.

**Input Variables:**
- `verb_infinitive`: The verb to practice
- `tense`: Present | Passé composé | Imparfait | Future | Conditional | Subjunctive (etc.)
- `target_language`: French | English
- `user_level`: A1 | A2 | B1 | B2 | C1 | C2

**Output JSON format:**
```json
{
  "verb": "infinitive",
  "tense": "tense name",
  "conjugations": [
    { "pronoun": "Je / I", "form": "suis / am", "blank": false },
    { "pronoun": "Tu / You", "form": "es / are", "blank": true }
  ],
  "tip": "Optional memory tip for this verb/tense (in Portuguese)"
}
```

**Rules:**
- For A1/A2: mark 2–3 cells as `blank: true`. For B1+: mark 4–5 cells.
- Always reveal at least 2 conjugations as examples so the user can identify the pattern.
- `tip` should reference a Portuguese parallel when one exists.

---

## 9. Verb Explorer Example Sentence Generation
**System Prompt:**
Generate 3 natural example sentences for the verb "{verb_infinitive}" in {target_language} in the "{tense}" tense.

**Input Variables:**
- `verb_infinitive`: The verb
- `tense`: The tense
- `target_language`: French | English
- `user_level`: A1 | A2 | B1 | B2 | C1 | C2

**Output JSON format:**
```json
[
  {
    "target": "Example sentence in the target language",
    "portuguese": "Brazilian Portuguese translation"
  }
]
```

**Rules:**
- Sentences must be contextually realistic (ordering food, work, travel, daily life).
- Vocabulary difficulty should match `user_level`.
- Each sentence should use a different subject pronoun.
