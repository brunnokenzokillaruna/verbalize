'use client';

import { Mic, MicOff, PhoneOff, Loader2 } from 'lucide-react';
import type { LiveSessionStatus } from '@/features/roleplay-chat/types';

export function SessionControls({
  status,
  micEnabled,
  isAssistantSpeaking,
  onToggleMic,
  onEnd,
  endDisabled = false,
}: {
  status: LiveSessionStatus;
  micEnabled: boolean;
  isAssistantSpeaking: boolean;
  onToggleMic: () => void;
  onEnd: () => void;
  /** Extra End disable (e.g. connect-time error before scripted fallback). */
  endDisabled?: boolean;
}) {
  const live = status === 'live';
  const endBlocked =
    endDisabled || status === 'idle' || status === 'connecting';

  return (
    <div
      className="sticky z-20 flex items-center justify-center gap-4 px-4 py-4 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] md:bottom-0"
      style={{
        borderTop: '2px solid var(--color-border)',
        backgroundColor: 'var(--color-bg)',
      }}
    >
      <button
        type="button"
        onClick={onToggleMic}
        disabled={!live}
        aria-label={micEnabled ? 'Desativar microfone' : 'Ativar microfone'}
        className="flex h-14 w-14 items-center justify-center rounded-full transition-transform active:scale-95 disabled:opacity-40 cursor-pointer"
        style={{
          backgroundColor: micEnabled ? 'var(--color-primary)' : 'var(--color-surface-raised)',
          color: micEnabled ? '#fff' : 'var(--color-text-secondary)',
          border: '1.5px solid var(--color-border)',
          boxShadow: '0 3px 0 var(--color-border)',
        }}
      >
        {micEnabled ? <Mic size={22} /> : <MicOff size={22} />}
      </button>

      <div className="min-w-[7rem] text-center">
        {status === 'connecting' && (
          <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-text-muted">
            <Loader2 size={14} className="animate-spin" /> Conectando…
          </p>
        )}
        {live && (
          <p className="text-xs font-semibold text-text-secondary">
            {isAssistantSpeaking
              ? 'Falando…'
              : micEnabled
                ? 'Sua vez — fale'
                : 'Ouvindo a saudação…'}
          </p>
        )}
        {(status === 'ended' || status === 'error') && (
          <p className="text-xs font-semibold text-text-muted">Sessão encerrada</p>
        )}
      </div>

      <button
        type="button"
        onClick={onEnd}
        disabled={endBlocked}
        aria-label="Encerrar conversa"
        className="flex h-14 w-14 items-center justify-center rounded-full transition-transform active:scale-95 disabled:opacity-40 cursor-pointer"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-error, #ef4444) 15%, transparent)',
          color: 'var(--color-error, #ef4444)',
          border: '1.5px solid var(--color-border)',
          boxShadow: '0 3px 0 var(--color-border)',
        }}
      >
        <PhoneOff size={22} />
      </button>
    </div>
  );
}
