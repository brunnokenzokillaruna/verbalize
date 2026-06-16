'use client';

import { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, X } from 'lucide-react';
import type { CurriculumSyncNotice } from '@/types/curriculumSync';
import { CURRICULUM_VERSION } from '@/lib/curriculum/lessonIdMigration';

interface CurriculumSyncNoticeBannerProps {
  notice: CurriculumSyncNotice;
  onDismiss: () => void;
}

function noticeStorageKey(version: number) {
  return `verbalize:curriculum-notice:v${version}`;
}

export function wasCurriculumNoticeDismissed(version: number): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(noticeStorageKey(version)) === '1';
}

export function markCurriculumNoticeDismissed(version: number): void {
  sessionStorage.setItem(noticeStorageKey(version), '1');
}

export function CurriculumSyncNoticeBanner({ notice, onDismiss }: CurriculumSyncNoticeBannerProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="animate-slide-up-spring mb-4 rounded-2xl border p-4"
      style={{
        backgroundColor: 'var(--color-primary-light)',
        borderColor: 'var(--color-primary)',
      }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2
          size={20}
          className="mt-0.5 shrink-0"
          style={{ color: 'var(--color-primary)' }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {notice.title}
          </p>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {notice.message}
          </p>

          {notice.details.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold"
              style={{ color: 'var(--color-primary)' }}
            >
              {expanded ? 'Ocultar detalhes' : 'Ver detalhes técnicos'}
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}

          {expanded && (
            <ul
              className="mt-2 space-y-1 rounded-xl p-3 text-xs font-mono"
              style={{
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-muted)',
              }}
            >
              {notice.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-lg p-1 transition-colors hover:bg-black/5"
          aria-label="Fechar aviso"
        >
          <X size={16} style={{ color: 'var(--color-text-muted)' }} />
        </button>
      </div>
    </div>
  );
}

export function shouldShowCurriculumNotice(notice: CurriculumSyncNotice | null): notice is CurriculumSyncNotice {
  if (!notice) return false;
  return !wasCurriculumNoticeDismissed(notice.reportVersion ?? CURRICULUM_VERSION);
}
