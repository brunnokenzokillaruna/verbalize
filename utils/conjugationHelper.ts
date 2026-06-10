import type { VerbDocument, SupportedLanguage } from '@/types';

export const TENSE_LABELS: Record<string, string> = {
  present: 'Presente',
  past: 'Passado',
  future: 'Futuro',
  conditional: 'Condicional',
  imperfect: 'Imperfeito',
  subjunctive: 'Subjuntivo',
};

export function inferLanguageFromPronoun(pronoun: string): SupportedLanguage {
  const p = pronoun.toLowerCase().split(/[\/|]/)[0].trim().replace(/\s*\(.+?\)\s*/g, '');
  if (['je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles'].includes(p)) {
    return 'fr';
  }
  return 'en';
}

/**
 * Returns only the conjugated verb, stripping a leading subject pronoun when present.
 * E.g. pronoun "il", form "il arrivera" → "arrivera"; form "j'arriverai" → "arriverai".
 */
export function extractVerbOnlyForm(
  pronoun: string,
  form: string,
  language?: SupportedLanguage,
): string {
  const cleanForm = form.trim();
  if (!cleanForm) return cleanForm;

  const lang = language ?? inferLanguageFromPronoun(pronoun);
  const pronounParts = pronoun.split(/[\/|]/).map((part) => {
    let clean = part.trim().replace(/\s*\(.+?\)\s*/g, '');
    if (clean.toUpperCase() === 'I') return 'I';
    return clean.toLowerCase();
  });

  for (const p of pronounParts) {
    const pLower = p.toLowerCase();
    const formLower = cleanForm.toLowerCase();

    if (formLower === pLower) continue;

    if (formLower.startsWith(pLower + ' ')) {
      return cleanForm.slice(pLower.length + 1).trim();
    }

    if (lang === 'fr') {
      if (pLower === 'je' && formLower.startsWith("j'")) {
        return cleanForm.slice(2).trim();
      }
      if (pLower === 'tu' && formLower.startsWith("t'")) {
        return cleanForm.slice(2).trim();
      }
    }
  }

  return cleanForm;
}

/**
 * Strips any known subject pronoun prefix from a conjugated form.
 * Useful when distractor options use a different subject than the prompt.
 */
export function stripPronounPrefix(
  form: string,
  language: SupportedLanguage,
  hintPronoun?: string,
): string {
  const clean = form.trim();
  if (!clean) return clean;

  if (hintPronoun) {
    const hinted = extractVerbOnlyForm(hintPronoun, clean, language);
    if (hinted !== clean) return hinted;
  }

  const pronouns =
    language === 'fr'
      ? ['je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles']
      : ['I', 'you', 'he', 'she', 'it', 'we', 'they'];

  for (const p of pronouns) {
    const stripped = extractVerbOnlyForm(p, clean, language);
    if (stripped !== clean) return stripped;
  }

  return clean;
}

/**
 * Returns clean audio text to synthesize, avoiding duplicate pronouns.
 * E.g., if pronoun is 'je' and form is 'je donne', returns 'je donne' instead of 'je je donne'.
 * If pronoun is 'je' and form is 'donne', returns 'je donne'.
 * Handles vowel contractions for French 'je' -> 'j'aime' if verb starts with vowel.
 */
export function getConjugationAudioText(
  pronoun: string,
  form: string,
  language: SupportedLanguage
): string {
  const cleanForm = form.trim();
  const cleanFormLower = cleanForm.toLowerCase();

  // 1. Parse and clean the pronoun
  const pronounParts = pronoun.split(/[\/|]/);
  const cleanParts = pronounParts.map(part => {
    let clean = part.trim();
    clean = clean.replace(/\s*\(.+?\)\s*/g, ''); // remove (pl.), etc.
    
    if (clean.toUpperCase() === 'I') {
      return 'I';
    }
    return clean.toLowerCase();
  });

  // 2. Check if cleanForm already starts with any of the clean pronoun parts
  // For French, we also check contractions like j' or t'.
  const startsWithPronoun = cleanParts.some(p => {
    const pLower = p.toLowerCase();
    
    if (cleanFormLower === pLower || cleanFormLower.startsWith(pLower + ' ')) {
      return true;
    }

    if (language === 'fr') {
      if (pLower === 'je' && cleanFormLower.startsWith("j'")) {
        return true;
      }
      if (pLower === 'tu' && cleanFormLower.startsWith("t'")) {
        return true;
      }
    }

    return false;
  });

  if (startsWithPronoun) {
    return cleanForm;
  }

  // 3. Otherwise, prepend the pronoun (or a suitable contraction if French "je")
  const primaryPronoun = cleanParts[0] || pronoun;
  
  if (language === 'fr' && primaryPronoun.toLowerCase() === 'je') {
    const startsWithVowelOrH = /^[aeiouyâêîôûäëïöüÿh]/i.test(cleanForm);
    if (startsWithVowelOrH) {
      return `j'${cleanForm}`;
    }
  }

  return `${primaryPronoun} ${cleanForm}`;
}

/**
 * Normalizes VerbDocument conjugations by splitting grouped pronouns (e.g. il/elle)
 * into separate entries, and ensuring target pronouns are all present and ordered.
 */
export function normalizeConjugations(
  conjugations: VerbDocument['conjugations'],
  language: SupportedLanguage
): VerbDocument['conjugations'] {
  if (!conjugations) return conjugations;

  const result: VerbDocument['conjugations'] = {} as any;

  const frPronouns = ['je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles'];
  const enPronouns = ['I', 'you', 'he', 'she', 'it', 'we', 'they'];
  const targetPronouns = language === 'fr' ? frPronouns : enPronouns;

  for (const tense of Object.keys(conjugations) as Array<keyof VerbDocument['conjugations']>) {
    const forms = conjugations[tense];
    if (!forms) continue;

    const newForms: Record<string, string> = {};

    // 1. Process existing forms, splitting any grouped pronouns
    for (const [rawPronoun, rawForm] of Object.entries(forms)) {
      const cleanForm = rawForm.trim();
      
      const splitPronouns = rawPronoun.split(/[\/|]/).map(p => {
        let clean = p.trim().replace(/\s*\(.+?\)\s*/g, '');
        if (clean.toUpperCase() === 'I') return 'I';
        return clean.toLowerCase();
      });

      // Find the verb part by removing any prefix pronoun that matches the split parts
      let verbPart = cleanForm;
      for (const p of splitPronouns) {
        const pLower = p.toLowerCase();
        if (cleanForm.toLowerCase().startsWith(pLower + ' ')) {
          verbPart = cleanForm.slice(pLower.length + 1).trim();
          break;
        } else if (language === 'fr') {
          if (pLower === 'je' && cleanForm.toLowerCase().startsWith("j'")) {
            verbPart = cleanForm.slice(2).trim();
            break;
          }
          if (pLower === 'tu' && cleanForm.toLowerCase().startsWith("t'")) {
            verbPart = cleanForm.slice(2).trim();
            break;
          }
        }
      }

      // Map each split pronoun to its conjugated form
      for (const p of splitPronouns) {
        let finalForm = cleanForm;
        const formLower = cleanForm.toLowerCase();
        const pLower = p.toLowerCase();
        const alreadyHasThisPronoun = 
          formLower === pLower || 
          formLower.startsWith(pLower + ' ') || 
          (language === 'fr' && pLower === 'je' && formLower.startsWith("j'")) ||
          (language === 'fr' && pLower === 'tu' && formLower.startsWith("t'"));

        if (!alreadyHasThisPronoun) {
          if (language === 'fr' && pLower === 'je' && /^[aeiouyâêîôûäëïöüÿh]/i.test(verbPart)) {
            finalForm = `j'${verbPart}`;
          } else {
            const displayPronoun = pLower === 'i' ? 'I' : p;
            finalForm = `${displayPronoun} ${verbPart}`;
          }
        }
        
        newForms[p] = finalForm;
      }
    }

    // 2. Ensure all target pronouns exist in the returned object, keeping the target order
    const orderedForms: Record<string, string> = {};
    for (const p of targetPronouns) {
      if (newForms[p]) {
        orderedForms[p] = newForms[p];
      } else {
        // Fallback: if a pronoun is missing, try to find a similar one to copy conjugation from
        let fallbackKey = '';
        if (p === 'elle' || p === 'on') fallbackKey = 'il';
        else if (p === 'elles') fallbackKey = 'ils';
        else if (p === 'she' || p === 'it') fallbackKey = 'he';
        
        const sourceKey = Object.keys(newForms).find(k => k.toLowerCase() === fallbackKey);
        if (sourceKey && newForms[sourceKey]) {
          const sourceForm = newForms[sourceKey];
          let verbPart = sourceForm;
          const sLower = sourceKey.toLowerCase();
          if (sourceForm.toLowerCase().startsWith(sLower + ' ')) {
            verbPart = sourceForm.slice(sLower.length + 1).trim();
          }
          
          if (language === 'fr' && p === 'je' && /^[aeiouyâêîôûäëïöüÿh]/i.test(verbPart)) {
            orderedForms[p] = `j'${verbPart}`;
          } else {
            orderedForms[p] = `${p} ${verbPart}`;
          }
        }
      }
    }

    // Copy any extra forms that weren't in targetPronouns
    for (const [p, f] of Object.entries(newForms)) {
      if (!orderedForms[p]) {
        orderedForms[p] = f;
      }
    }

    result[tense] = orderedForms;
  }

  return result;
}

/**
 * Normalizes Grammar Bridge's conjugationPreview array by splitting grouped pronouns
 * and ordering them properly.
 */
export function normalizeConjugationPreview(
  preview: Array<{ pronoun: string; form: string }>,
  language: SupportedLanguage
): Array<{ pronoun: string; form: string }> {
  if (!preview) return preview;

  const frPronouns = ['je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles'];
  const enPronouns = ['I', 'you', 'he', 'she', 'it', 'we', 'they'];
  const targetPronouns = language === 'fr' ? frPronouns : enPronouns;

  const newPreviewMap: Record<string, string> = {};

  for (const item of preview) {
    const rawPronoun = item.pronoun;
    const cleanForm = item.form.trim();

    const splitPronouns = rawPronoun.split(/[\/|]/).map(p => {
      let clean = p.trim().replace(/\s*\(.+?\)\s*/g, '');
      if (clean.toUpperCase() === 'I') return 'I';
      return clean.toLowerCase();
    });

    let verbPart = cleanForm;
    for (const p of splitPronouns) {
      const pLower = p.toLowerCase();
      if (cleanForm.toLowerCase().startsWith(pLower + ' ')) {
        verbPart = cleanForm.slice(pLower.length + 1).trim();
        break;
      } else if (language === 'fr') {
        if (pLower === 'je' && cleanForm.toLowerCase().startsWith("j'")) {
          verbPart = cleanForm.slice(2).trim();
          break;
        }
        if (pLower === 'tu' && cleanForm.toLowerCase().startsWith("t'")) {
          verbPart = cleanForm.slice(2).trim();
          break;
        }
      }
    }

    for (const p of splitPronouns) {
      let finalForm = cleanForm;
      const formLower = cleanForm.toLowerCase();
      const pLower = p.toLowerCase();
      const alreadyHasThisPronoun = 
        formLower === pLower || 
        formLower.startsWith(pLower + ' ') || 
        (language === 'fr' && pLower === 'je' && formLower.startsWith("j'")) ||
        (language === 'fr' && pLower === 'tu' && formLower.startsWith("t'"));

      if (!alreadyHasThisPronoun) {
        if (language === 'fr' && pLower === 'je' && /^[aeiouyâêîôûäëïöüÿh]/i.test(verbPart)) {
          finalForm = `j'${verbPart}`;
        } else {
          const displayPronoun = pLower === 'i' ? 'I' : p;
          finalForm = `${displayPronoun} ${verbPart}`;
        }
      }
      newPreviewMap[p] = finalForm;
    }
  }

  const result: Array<{ pronoun: string; form: string }> = [];
  for (const p of targetPronouns) {
    if (newPreviewMap[p]) {
      result.push({ pronoun: p, form: newPreviewMap[p] });
    } else {
      let fallbackKey = '';
      if (p === 'elle' || p === 'on') fallbackKey = 'il';
      else if (p === 'elles') fallbackKey = 'ils';
      else if (p === 'she' || p === 'it') fallbackKey = 'he';

      const sourceKey = Object.keys(newPreviewMap).find(k => k.toLowerCase() === fallbackKey);
      if (sourceKey && newPreviewMap[sourceKey]) {
        const sourceForm = newPreviewMap[sourceKey];
        let verbPart = sourceForm;
        const sLower = sourceKey.toLowerCase();
        if (sourceForm.toLowerCase().startsWith(sLower + ' ')) {
          verbPart = sourceForm.slice(sLower.length + 1).trim();
        }

        let finalForm = '';
        if (language === 'fr' && p === 'je' && /^[aeiouyâêîôûäëïöüÿh]/i.test(verbPart)) {
          finalForm = `j'${verbPart}`;
        } else {
          finalForm = `${p} ${verbPart}`;
        }
        result.push({ pronoun: p, form: finalForm });
      }
    }
  }

  for (const [p, f] of Object.entries(newPreviewMap)) {
    if (!result.some(r => r.pronoun === p)) {
      result.push({ pronoun: p, form: f });
    }
  }

  return result;
}
