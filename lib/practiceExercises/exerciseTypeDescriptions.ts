import type { ExerciseTypeId } from './constants';

export function buildTypeDescriptions(langLabel: string): Record<ExerciseTypeId, string> {
  return {
    'context-choice': `type "context-choice":
   - Write an ORIGINAL sentence with a blank (___) for a key vocabulary word or grammar item.
   - "blankWord" is correct answer. "options" has 4 items: the correct word plus 3 highly plausible distractors of the same grammatical category, similar spelling/tense, or common learner mistakes. Do NOT use obviously different or unrelated words. The options must make the student think.
   - "translation" in PT-BR.`,
    'error-correction': `type "error-correction":
   - Write an ORIGINAL sentence with ONE deliberate error.
   - "sentence_with_error", "error_word", "correct_word", "corrected_sentence", "translation" (PT-BR: translation of corrected_sentence), "explanation" (PT-BR).
   - "corrected_sentence" is ALWAYS required: the full sentence after fixing the error.
   - "answer_mode": "replace" when the student only types the replacement word/phrase; "rewrite" when they must type the full corrected sentence (use for deletions, multi-word fixes, or redundant repetition like pronoun + noun).
   - When the fix is to REMOVE a word (e.g. redundant "du pain" after "en"), set answer_mode to "rewrite", correct_word to the removed span, and corrected_sentence to the full fixed sentence. NEVER leave correct_word empty and NEVER ask the student to leave the answer blank.
   - When the fix is to REPLACE one word, set answer_mode to "replace", correct_word to the replacement, and corrected_sentence to the full fixed sentence.
   - FORBIDDEN for error-correction (use sentence-builder, grammar-trap, bridge-choice, or context-choice instead): errors that require MOVING words to a new position — e.g. COI/COD clitic placement ("je parle à lui" → "je lui parle"), negation word order ("je parle pas" → "je ne parle pas"), adverb repositioning. Highlighting error_word misleads the student when the fix is reordering, not substitution.
   - CRITICAL: "error_word" must appear EXACTLY ONCE in "sentence_with_error". If the natural context repeats the phrase (e.g. question + answer both with "du pain"), isolate ONLY the clause with the error — e.g. use "Oui, j'en ai du pain." instead of "Tu as du pain ? Oui, j'en ai du pain."
   - If error_word truly cannot be unique, set "error_span_start" to the 0-based character index where the erroneous occurrence begins.
   - "acceptable_answers" is an array of other valid corrected sentences or replacement words, or empty.`,
    'reverse-translation': `type "reverse-translation":
   - "portuguese_sentence" (PT-BR) → "target_translation" (${langLabel}).
   - "acceptable_variants" (2-4 alternative phrasings).
   - "hint" (optional grammar tip in PT-BR).
   - Optional chain fields: "linkedExerciseId" (e.g. "chain-1") and "chainAnchorPhrase" (${langLabel} phrase shared with a paired listening-comprehension exercise).`,
    'word-bank-translation': `type "word-bank-translation":
   - "portuguese_sentence" (PT-BR sentence to translate).
   - "correctOrder" (array of ${langLabel} words in correct order).
   - "words" (EXACT same words as correctOrder, shuffled).
   - "acceptable_variants" (0-2 alternative word orders as arrays).
   - "hint" (optional PT-BR grammar tip).`,
    'bridge-choice': `type "bridge-choice":
   - MCQ testing Brazilian Portuguese interference on the lesson grammar focus.
   - "scenario" (PT-BR, 1-2 sentences of context).
   - "question" (PT-BR).
   - "options" (3-4 complete sentences or phrases in ${langLabel}).
   - "correctIndex" (0-based).
   - "explanation" (PT-BR). NEVER use "primeira opção", "segunda opção", etc. — quote key phrases or describe errors by content, because options are shuffled on screen.
   - "trapRule" (optional PT-BR, 1 sentence about the interference pattern).`,
    'listen-and-select': `type "listen-and-select":
   - "audioText" (${langLabel} sentence to be played via TTS).
   - "options" (4 written transcriptions — 1 correct, 3 plausible but wrong).
   - "correctIndex" (0-based).
   - "translation" (PT-BR hint).`,
    'listening-comprehension': `type "listening-comprehension":
   - "dialogueAudio" (3-5 line ORIGINAL ${langLabel} dialogue using Speaker: line format — related to lesson theme, NOT copied from the lesson dialogue).
   - "questionPt" (comprehension question in PT-BR about dialogue meaning, intent, or key detail).
   - "options" (3 answer choices in PT-BR — 1 correct, 2 plausible distractors).
   - "correctIndex" (0-based).
   - "explanationPt" (short PT-BR explanation after answering).
   - Optional chain fields: "linkedExerciseId" (e.g. "chain-1") and "chainAnchorPhrase" (one key ${langLabel} phrase from dialogueAudio for a paired production exercise).
   - The student listens WITHOUT seeing the dialogue text — test comprehension, not transcription.`,
    'audio-dictation': `type "audio-dictation":
   - Short ORIGINAL sentence. "text" (${langLabel}), "translation" (PT-BR).`,
    'speak-repeat': `type "speak-repeat":
   - Short ORIGINAL sentence. "text" (${langLabel}), "translation" (PT-BR).`,
    shadowing: `type "shadowing":
   - Short ORIGINAL sentence (6-14 words) for speak-along practice.
   - "text" (${langLabel}), "translation" (PT-BR).
   - "tip" (optional PT-BR): brief note on rhythm, liaison, or intonation to mimic.`,
    'sentence-builder': `type "sentence-builder":
   - Short ORIGINAL sentence (3-8 words).
   - "correctOrder" (array of words in the correct order), "words" (array of the EXACT same words, shuffled), "translation" (PT-BR).
   - "explanation" (PT-BR): 1-2 short sentences explaining the word order — especially adverb placement vs Portuguese when relevant.
   - CRITICAL: "words" MUST contain the exact same words as "correctOrder". No missing words, no extra distractors.`,
    'social-roleplay': `type "social-roleplay":
   - "context" (PT-BR) describing the situation.
   - "promptLine" (${langLabel}) what the NPC says.
   - "options" (3 responses in target language). The correct option must use the target expression naturally. The other 2 options MUST be highly plausible, grammatically correct responses in target language that are contextually inappropriate or slightly incorrect (e.g. wrong pronoun, incorrect politeness level, or a subtle mismatch in context). DO NOT generate silly, obviously wrong, or unrelated distractors. The options should make the student think.
   - "correctIndex" (0-2), "explanation" (PT-BR). In "explanation", NEVER refer to "primeira opção", "segunda opção", etc. — quote key phrases from each response or describe the grammatical difference directly, because options are shuffled on screen.`,
    'scrambled-conversation': `type "scrambled-conversation":
   - A short sequence of 3-4 dialogue lines.
   - "lines" (correct order), "shuffledLines" (random order).
   - CRITICAL COHERENCE:
     1. Labeled Speakers: Every line MUST start with a speaker's name (e.g., "Marie: ...", "Thomas: ..."). The speakers MUST alternate (A -> B -> A -> B) to establish structure.
     2. Unambiguous Logical Ordering: The conversation must have exactly ONE logical chronological order. Use strong chronological clues: greeting at the start, question followed by its direct answer, request followed by its fulfillment, and a closing remark/despedida at the end.
     3. No Ambiguity: Do not write lines that could logically be swapped or placed in multiple positions (e.g., multiple general thank-yous or remarks). Every line must have a unique, necessary position in the chain.`,
    'interactive-subtitles': `type "interactive-subtitles":
   - "correctText" (original sentence).
   - "errorText" (copy of correctText but with 1-2 words swapped for wrong ones or misspelled).
   - "wrongWords" (array of the words that are WRONG in errorText).
   - "corrections" (array with ONE entry per wrong word): each { "wrong": "word in errorText", "correct": "replacement word", "options": [correct + 2 plausible distractors of same category] }.
   - "translations" (PT-BR).`,
    'logic-connectors': `type "logic-connectors":
    - "partA" (first half), "partB" (second half).
    - "options" (3 connectors like 'but', 'because', 'so').
    - "correctConnector", "translation" (PT-BR).`,
    'grammar-trap': `type "grammar-trap":
   - This exercise tests whether the student can identify the CORRECT sentence among traps.
   - "scenario" (PT-BR, 1-2 sentences): brief context about the Brazilian interference being tested.
   - "question" (PT-BR): e.g. "Qual destas frases esta CORRETA?"
   - "options": array of EXACTLY 4 objects, each with:
     - "sentence" (target language): a complete sentence
     - "translation" (PT-BR): natural translation
     - "isCorrect" (boolean): EXACTLY ONE must be true
   - The 3 incorrect options MUST contain classic errors Brazilians make due to Portuguese interference on the grammar focus of this lesson.
   - The 1 correct option must be perfectly grammatical.
   - "explanation" (PT-BR): clear explanation of WHY the correct answer is right and why the traps are wrong. NEVER use "primeira opção", "segunda opção", etc. — quote key phrases from each sentence, because options are shuffled on screen.
   - "trapRule" (PT-BR, 1 sentence): the core Brazilian error pattern.`,
    'minimal-pair': `type "minimal-pair":
   - This exercise trains auditory discrimination between similar-sounding words.
   - "wordA" (target language): first word of the pair (e.g. "poisson").
   - "wordB" (target language): second word, minimal pair (e.g. "poison"). Must differ by only 1-2 sounds.
   - "correctWord": which word fits the sentence context (must equal wordA or wordB).
   - "sentenceContext" (target language): a sentence using the correctWord naturally.
   - "translation" (PT-BR): translation of the sentence.
   - "tip" (PT-BR): a pronunciation tip to help distinguish the two sounds.`,
    'minimal-pair-production': `type "minimal-pair-production":
   - Same data schema as "minimal-pair" (wordA, wordB, correctWord, sentenceContext, translation, tip).
   - The learner will SPEAK the correct word aloud (not multiple choice).
   - Choose pairs where oral production clearly distinguishes the sounds.`,
    'conjugation-speed': `type "conjugation-speed":
   - This exercise tests quick verb conjugation.
   - "verb" (infinitive form in target language).
   - "pronoun" (subject pronoun, e.g. "je", "il", "nous", "vous").
   - "tense" (PT-BR tense name, e.g. "presente", "passe compose").
   - "correctForm" (correctly conjugated form).
   - "options" (array of EXACTLY 4 UNIQUE strings: 1 correct + 3 highly plausible but wrong conjugations of the SAME verb. No duplicates allowed.).
   - "exampleSentence" (target language): a complete sentence using the correct form.
   - "translation" (PT-BR): translation of the example sentence.`,
    'listen-and-respond': `type "listen-and-respond":
   - "dialogueAudio" (3-4 line ORIGINAL ${langLabel} dialogue — Speaker: line format; last line is a question or request TO the learner).
   - "promptLine" (${langLabel}): the final line the learner must respond to.
   - "contextPt" (PT-BR): situation setup for the learner.
   - "evaluationCriteria" (PT-BR): rubric for acceptable responses (intent, register, key ideas).
   - "acceptableThemes" (array of 2-4 PT-BR phrases describing valid response ideas).
   - "exampleResponse" (${langLabel}): one natural example answer (not the only valid answer).`,
    'free-roleplay': `type "free-roleplay":
   - "context" (PT-BR): situational setup.
   - "promptLine" (${langLabel}): what the interlocutor says.
   - "evaluationCriteria" (PT-BR): what a good response must accomplish.
   - "acceptableThemes" (2-4 PT-BR valid response ideas).
   - "exampleResponse" (${langLabel}): model answer.
   - "explanation" (PT-BR): why the example works pragmatically.`,
    'micro-message': `type "micro-message":
   - "context" (PT-BR): chat/email scenario (informal register).
   - "incomingMessage" (${langLabel}): message received.
   - "translation" (PT-BR): hint for incoming message.
   - "evaluationCriteria" (PT-BR): what the reply must include.
   - "exampleResponse" (${langLabel}): natural short reply (1-2 sentences).`,
    paraphrase: `type "paraphrase":
   - "source_sentence" (${langLabel}): original sentence the learner saw.
   - "source_translation" (PT-BR): meaning of the source sentence.
   - "target_paraphrase" (${langLabel}): one valid paraphrase (same meaning, different wording — at least 2 words changed).
   - "acceptable_variants" (2-4 alternative paraphrases with same meaning).
   - "hint" (optional PT-BR tip about synonym or structure change).`,
    'fill-gap-production': `type "fill-gap-production":
   - "sentence" (${langLabel} sentence with exactly one "___" blank for a key word).
   - "blankWord" (correct word to type — NOT multiple choice).
   - "translation" (PT-BR translation of the full sentence).
   - "acceptable_variants" (0-2 acceptable alternate spellings or forms).`,
    'translation-with-constraint': `type "translation-with-constraint":
   - "portuguese_sentence" (PT-BR sentence to translate).
   - "required_chunk" (${langLabel}): a word or short phrase FROM THIS LESSON's key vocabulary or dialogue — the learner MUST include it in their translation.
   - "target_translation" (${langLabel}): model answer that naturally includes required_chunk.
   - "acceptable_variants" (2-4 valid alternatives that also include required_chunk).
   - "constraint_explanation" (PT-BR): why this chunk is required/natural here.`,
    'voicemail-dictation': `type "voicemail-dictation":
   - A longer voicemail message (2-4 sentences in ${langLabel}) the learner listens to.
   - "audioText" (${langLabel}): the full voicemail (natural spoken register, 25-60 words).
   - "contextPt" (PT-BR): scenario setup (e.g. "Correio de voz do chefe").
   - "expected_summary" (PT-BR): 1-2 sentence summary of the key message.
   - "acceptable_summaries" (2-3 valid PT-BR summary variants).
   - "key_points" (optional array of 2-3 PT-BR bullet ideas covered in the message).`,
    'inference-tone': `type "inference-tone":
   - Two short utterances in ${langLabel} that differ in TONE/REGISTER (not just vocabulary) — e.g. polite vs impatient, sincere vs sarcastic, formal vs casual.
   - "contextPt" (PT-BR scenario).
   - "questionPt" (PT-BR): which audio matches a target tone? e.g. "Qual fala soa mais impaciente?"
   - "targetTonePt" (PT-BR): the tone tested, e.g. "impaciência".
   - "audioTextA", "audioTextB" (${langLabel}): two DIFFERENT sentences expressing contrasting attitudes in the same situation.
   - "labelA", "labelB" (PT-BR): short tone labels for each audio (for feedback).
   - "correctOption": "A" or "B" — which audio matches questionPt.
   - "explanationPt" (PT-BR): why the correct utterance carries that tone.`,
    'connected-speech': `type "connected-speech":
   - Sentence in ${langLabel} featuring a clear connected-speech phenomenon (French: liaison, elision, enchaînement; English: linking, reduction).
   - "audioText" (${langLabel}): full sentence for TTS (same as expected_transcription in standard orthography).
   - "translation" (PT-BR).
   - "contextPt" (PT-BR): brief scenario.
   - "phenomenonPt" (PT-BR): name the phenomenon, e.g. "Liaison entre 'les' e 'amis'".
   - "segmentedForm" (PT-BR or ${langLabel}): words separated visually, e.g. "les | amis" or "an | apple".
   - "linkedForm" (PT-BR): how it sounds when connected, e.g. "les‿z‿amis" or "a-napple".
   - "expected_transcription" (${langLabel}): standard spelling the learner should write after listening.
   - "acceptable_variants" (1-3 valid spelling variants).
   - "explanationPt" (PT-BR): 1-2 sentences on the pronunciation rule.`,
    'story-continuation': `type "story-continuation":
   - Micro-narrative: learner continues an incomplete story in ${langLabel}.
   - "storyOpening" (2-3 sentences in ${langLabel}) — ends on an open moment (pending action, question, or cliffhanger). NOT a complete story.
   - "storyTranslation" (PT-BR translation of storyOpening).
   - "contextPt" (PT-BR): who, where, when — narrative setup.
   - "promptPt" (PT-BR): task, e.g. "Continue a história com 1-2 frases".
   - "evaluationCriteria" (PT-BR): rubric for coherence, tense consistency, logical next beat.
   - "acceptableThemes" (2-4 PT-BR directions/themes that count as valid continuations).
   - "exampleContinuation" (${langLabel}): 1-2 sentences continuing naturally.
   - "explanationPt" (PT-BR): why the example works (link, tense, narrative logic).
   - Use lesson vocabulary; do NOT copy the lesson dialogue verbatim.`,
    'spot-the-register': `type "spot-the-register":
   - Short dialogue (2-4 lines in ${langLabel}) where ONE line uses the WRONG register for the situation (too formal, too informal, wrong tu/vous, etc.).
   - "context" (PT-BR scenario with social relationship and setting).
   - "dialogueLines" (array of 2-4 ${langLabel} lines in order).
   - "wrongLineIndex" (0-based index of the line with inappropriate register).
   - "registerIssuePt" (PT-BR): what is wrong, e.g. "Informal demais para falar com o gerente".
   - "targetRegisterPt" (PT-BR): expected register, e.g. "Formal e respeitoso (vous)".
   - "evaluationCriteria" (PT-BR): rubric for rewriting with correct register while keeping the same intent.
   - "acceptableThemes" (2-3 PT-BR acceptable directions for the rewrite).
   - "correctedLine" (${langLabel}): the wrong line rewritten with appropriate register (same meaning).
   - "explanationPt" (PT-BR): why the original fails socially and why the correction fits.`,
    'prompted-monologue': `type "prompted-monologue":
   - Extended oral production: learner speaks 30-60 seconds (aim for 3-6 sentences) on a given topic in ${langLabel}.
   - "contextPt" (PT-BR scenario — who/where/why they are speaking).
   - "promptPt" (PT-BR topic question, e.g. "Fale sobre sua rotina de manhã").
   - "speakingGoalPt" (PT-BR): duration/scope cue, e.g. "Fale por 30-60 segundos, 3-5 frases".
   - "evaluationCriteria" (PT-BR): rubric — coherence, vocabulary from lesson, complete answer to prompt.
   - "acceptableThemes" (2-4 PT-BR themes/points the answer should touch).
   - "exampleMonologue" (${langLabel}): 3-6 sentence model answer (not necessarily read aloud by learner).
   - "keyPoints" (optional array of 2-3 PT-BR bullet ideas to cover).
   - "explanationPt" (PT-BR): why the model monologue works structurally.`,
  };
}
