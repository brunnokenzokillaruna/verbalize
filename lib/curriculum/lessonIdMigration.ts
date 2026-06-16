import type { SupportedLanguage, UserDocument } from '@/types';
import type { CurriculumSyncNotice, CurriculumSyncReport } from '@/types/curriculumSync';
import { getLessonsForLanguage } from '@/lib/curriculum';
import { INITIAL_LESSON_PROGRESS } from '@/lib/curriculum/lessonProgress';

/** Bump when lesson IDs or order change in a breaking way. */
export const CURRICULUM_VERSION = 3;

const V1_LESSON_COUNT = 418;
const V2_LESSON_COUNT = 430;

/** v1→v2: 12 lessons inserted (both fr and en). 0-based anchor index in v1 list. */
const V1_INSERTION_ANCHORS: ReadonlyArray<{ afterIndex: number; count: number }> = [
  { afterIndex: 118, count: 2 },
  { afterIndex: 176, count: 1 },
  { afterIndex: 177, count: 1 },
  { afterIndex: 187, count: 1 },
  { afterIndex: 195, count: 2 },
  { afterIndex: 202, count: 1 },
  { afterIndex: 205, count: 1 },
  { afterIndex: 219, count: 1 },
  { afterIndex: 239, count: 2 },
];

/** v2→v3: 14 English-only lessons. 0-based anchor index in the v2 EN catalog (430 lessons). */
export const V2_EN_INSERTION_ANCHORS: ReadonlyArray<{ afterIndex: number; count: number }> = [
  { afterIndex: 113, count: 3 },
  { afterIndex: 139, count: 4 },
  { afterIndex: 202, count: 1 },
  { afterIndex: 210, count: 1 },
  { afterIndex: 214, count: 3 },
  { afterIndex: 277, count: 2 },
];

function insertionShiftStrictlyBefore(
  index: number,
  anchors: ReadonlyArray<{ afterIndex: number; count: number }>,
): number {
  let shift = 0;
  for (const { afterIndex, count } of anchors) {
    if (afterIndex < index) shift += count;
  }
  return shift;
}

function frontierShiftForOldIndex(
  oldIndex: number,
  anchors: ReadonlyArray<{ afterIndex: number; count: number }>,
): number {
  if (oldIndex <= 0) return 0;
  return insertionShiftStrictlyBefore(oldIndex - 1, anchors);
}

function contentShiftForOldIndex(
  oldIndex: number,
  anchors: ReadonlyArray<{ afterIndex: number; count: number }>,
): number {
  return insertionShiftStrictlyBefore(oldIndex, anchors);
}

export function parseLessonSequenceIndex(
  id: string,
): { language: SupportedLanguage; index: number } | null {
  const match = id.match(/^(fr|en)-[a-z]\d-(\d{3})$/i);
  if (!match) return null;

  const language = match[1] as SupportedLanguage;
  const sequence = Number.parseInt(match[2]!, 10);
  if (Number.isNaN(sequence) || sequence < 1) return null;

  return { language, index: sequence - 1 };
}

/** @deprecated Use parseLessonSequenceIndex — kept for validation scripts. */
export function parseLegacyLessonIndex(id: string): number | null {
  const parsed = parseLessonSequenceIndex(id);
  if (!parsed || parsed.index >= V1_LESSON_COUNT) return null;
  return parsed.index;
}

function lessonIdAtIndex(language: SupportedLanguage, index: number): string | null {
  const lessons = getLessonsForLanguage(language);
  if (index < 0 || index >= lessons.length) return null;
  return lessons[index]!.id;
}

function applyAnchorChain(
  language: SupportedLanguage,
  startIndex: number,
  fromVersion: number,
  mode: 'frontier' | 'content',
): number | null {
  let index = startIndex;

  if (fromVersion < 2) {
    if (index >= V1_LESSON_COUNT) return null;
    const shift =
      mode === 'frontier'
        ? frontierShiftForOldIndex(index, V1_INSERTION_ANCHORS)
        : contentShiftForOldIndex(index, V1_INSERTION_ANCHORS);
    index += shift;
  } else if (fromVersion < 3) {
    if (index >= V2_LESSON_COUNT) return null;
  }

  if (language === 'en' && fromVersion < 3) {
    const shift =
      mode === 'frontier'
        ? frontierShiftForOldIndex(index, V2_EN_INSERTION_ANCHORS)
        : contentShiftForOldIndex(index, V2_EN_INSERTION_ANCHORS);
    index += shift;
  }

  return index;
}

export function migrateFrontierLessonId(
  language: SupportedLanguage,
  storedId: string,
  fromVersion = 1,
): string | null {
  const lessons = getLessonsForLanguage(language);
  if (fromVersion >= CURRICULUM_VERSION && lessons.some((lesson) => lesson.id === storedId)) {
    return storedId;
  }

  const parsed = parseLessonSequenceIndex(storedId);
  if (!parsed || parsed.language !== language) return null;

  const newIndex = applyAnchorChain(language, parsed.index, fromVersion, 'frontier');
  if (newIndex === null) return null;

  return lessonIdAtIndex(language, newIndex);
}

export function migrateContentLessonId(
  language: SupportedLanguage,
  storedId: string,
  fromVersion = 1,
): string | null {
  const lessons = getLessonsForLanguage(language);
  if (fromVersion >= CURRICULUM_VERSION && lessons.some((lesson) => lesson.id === storedId)) {
    return storedId;
  }

  const parsed = parseLessonSequenceIndex(storedId);
  if (!parsed || parsed.language !== language) return null;

  const newIndex = applyAnchorChain(language, parsed.index, fromVersion, 'content');
  if (newIndex === null) return null;

  return lessonIdAtIndex(language, newIndex);
}

export function getStoredCurriculumVersion(profile: Pick<UserDocument, 'curriculumVersion'>): number {
  return profile.curriculumVersion ?? 1;
}

export function needsCurriculumMigration(profile: Pick<UserDocument, 'curriculumVersion'>): boolean {
  return getStoredCurriculumVersion(profile) < CURRICULUM_VERSION;
}

export function isFutureCurriculumVersion(profile: Pick<UserDocument, 'curriculumVersion'>): boolean {
  return getStoredCurriculumVersion(profile) > CURRICULUM_VERSION;
}

export function migrateLessonProgressRecord(
  lessonProgress: UserDocument['lessonProgress'],
  fromVersion: number,
): { lessonProgress: NonNullable<UserDocument['lessonProgress']>; changes: CurriculumSyncReport['progressChanges'] } {
  const next: NonNullable<UserDocument['lessonProgress']> = {
    fr: lessonProgress?.fr ?? INITIAL_LESSON_PROGRESS.fr,
    en: lessonProgress?.en ?? INITIAL_LESSON_PROGRESS.en,
  };
  const changes: CurriculumSyncReport['progressChanges'] = [];

  for (const language of ['fr', 'en'] as SupportedLanguage[]) {
    const currentId = lessonProgress?.[language];
    if (!currentId) continue;

    const migratedId = migrateFrontierLessonId(language, currentId, fromVersion);
    if (!migratedId || migratedId === currentId) continue;

    next[language] = migratedId;
    changes.push({ language, from: currentId, to: migratedId });
  }

  return { lessonProgress: next, changes };
}

export function buildCurriculumSyncNotice(report: CurriculumSyncReport): CurriculumSyncNotice | null {
  const details: string[] = [];

  for (const change of report.progressChanges) {
    details.push(`${change.language.toUpperCase()}: ${change.from} → ${change.to}`);
  }
  for (const change of report.sanitizedChanges) {
    details.push(`${change.language.toUpperCase()}: ${change.from} → ${change.to} (${change.reason})`);
  }
  if (report.mistakesUpdated > 0) {
    details.push(`${report.mistakesUpdated} registro(s) de erro atualizado(s).`);
  }
  if (report.pregenCleared > 0) {
    details.push(`${report.pregenCleared} cache(s) de lição limpo(s).`);
  }

  const enChanges = report.progressChanges.filter((change) => change.language === 'en');
  const frChanges = report.progressChanges.filter((change) => change.language === 'fr');

  const hasChanges =
    report.migrated ||
    report.progressChanges.length > 0 ||
    report.sanitizedChanges.length > 0 ||
    report.mistakesUpdated > 0 ||
    report.pregenCleared > 0;

  if (!hasChanges) return null;

  const onlySanitized = !report.migrated && report.sanitizedChanges.length > 0;
  const englishV3Migration = report.toVersion === 3 && enChanges.length > 0 && frChanges.length === 0;
  const bothLanguagesMigrated = frChanges.length > 0 && enChanges.length > 0;

  let title = 'Progresso corrigido';
  let message =
    'Corrigimos referências de lições inválidas no seu perfil para evitar bugs no caminho de estudo.';

  if (report.migrated) {
    if (englishV3Migration) {
      title = 'Currículo de inglês atualizado';
      message =
        'Seu progresso em inglês foi ajustado para incluir 14 novas lições (collocations, phrasal verbs e conversação). Nada foi perdido.';
    } else if (bothLanguagesMigrated || frChanges.length > 0) {
      title = 'Currículo atualizado';
      message =
        'Seu progresso foi ajustado para incluir novas lições. Nada foi perdido — continue de onde parou.';
    } else {
      title = 'Currículo atualizado';
      message = 'Seu progresso foi sincronizado com o catálogo mais recente de lições.';
    }
  } else if (!onlySanitized) {
    title = 'Progresso sincronizado';
    message = 'Ajustamos seu progresso para ficar consistente com o catálogo atual de lições.';
  }

  return {
    reportVersion: report.toVersion,
    title,
    message,
    details,
  };
}

export function buildUserCurriculumMigrationUpdates(
  profile: UserDocument,
): Partial<UserDocument> | null {
  if (!needsCurriculumMigration(profile)) return null;

  const fromVersion = getStoredCurriculumVersion(profile);
  const { lessonProgress, changes } = migrateLessonProgressRecord(profile.lessonProgress, fromVersion);

  return {
    lessonProgress,
    curriculumVersion: CURRICULUM_VERSION,
    curriculumMigrationMeta: {
      version: CURRICULUM_VERSION,
      fromVersion,
      progressChanges: changes,
    },
  };
}

export function shouldClearPregenCacheOnMigration(
  profile: UserDocument,
  progressChanges: CurriculumSyncReport['progressChanges'],
): boolean {
  const fromVersion = getStoredCurriculumVersion(profile);
  if (fromVersion >= CURRICULUM_VERSION) return false;

  if (fromVersion < 2) return true;

  return progressChanges.some((change) => change.language === 'en');
}
