import type { LessonDefinition, LessonRole } from '@/types';

const ROLE_LABEL_PT: Record<LessonRole, string> = {
  introduce: 'Introdução',
  contrast: 'Contraste',
  reinforce: 'Reforço',
  practice: 'Prática',
};

export function getLessonRoleLabel(role: LessonRole | undefined): string | null {
  if (!role) return null;
  return ROLE_LABEL_PT[role] ?? null;
}

/**
 * Among lessons that share topicKey, return 1-based stage index and family size.
 * Returns null when the topic is a singleton (no path "Etapa" chrome).
 */
export function getTopicStage(
  lesson: LessonDefinition,
  siblings: LessonDefinition[],
): { index: number; total: number; label: string } | null {
  if (!lesson.topicKey) return null;
  const family = siblings.filter((l) => l.topicKey === lesson.topicKey);
  if (family.length < 2) return null;
  const index = family.findIndex((l) => l.id === lesson.id) + 1;
  if (index < 1) return null;
  const roleLabel = getLessonRoleLabel(lesson.lessonRole);
  const label = roleLabel
    ? `Etapa ${index}/${family.length} · ${roleLabel}`
    : `Etapa ${index}/${family.length}`;
  return { index, total: family.length, label };
}

export function buildLessonRolePromptGuidance(role: LessonRole | undefined): string {
  switch (role) {
    case 'introduce':
      return `LESSON ROLE = INTRODUCE: Teach meaning and basic use of the focus terms. Prefer clear examples over discrimination drills. Do NOT spend the whole lesson on "which word is correct" traps yet.`;
    case 'contrast':
      return `LESSON ROLE = CONTRAST: The learner already met these terms. Focus on DISCRIMINATION — when to pick each form, contrastive examples, and Brazilian mix-up traps. Avoid re-teaching basic definitions as if new.`;
    case 'reinforce':
      return `LESSON ROLE = REINFORCE (spiral review): The learner already studied this topic earlier. Do NOT re-teach from zero. Quick recall + harder production + edge cases. Keep insight short; prioritize practice-ready patterns.`;
    case 'practice':
      return `LESSON ROLE = PRACTICE: Assume core meaning is known. Emphasize fluent use in context over metalanguage.`;
    default:
      return '';
  }
}
