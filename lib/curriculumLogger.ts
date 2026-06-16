/** Structured curriculum sync / migration logging (dev + production). */

export type CurriculumLogEvent =
  | 'sync_start'
  | 'sync_complete'
  | 'sync_noop'
  | 'migration_applied'
  | 'progress_sanitized'
  | 'mistakes_migrated'
  | 'pregen_cleared'
  | 'invalid_version'
  | 'sync_error';

export function logCurriculum(
  event: CurriculumLogEvent,
  data?: Record<string, unknown>,
): void {
  const payload = {
    scope: 'curriculum',
    event,
    ts: new Date().toISOString(),
    ...data,
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('[Curriculum]', payload);
  } else {
    console.info('[Curriculum]', JSON.stringify(payload));
  }
}
