'use client';

import { Book, Zap, Mic, MessageSquare, Target, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
import type { LessonTag, SupportedLanguage } from '@/types';

const TAG_CONFIG: Record<LessonTag, {
  icon: React.ElementType;
  title: string;
  desc: string;
  gradient: string;
  accent: string;
  shadow: string;
}> = {
  GRAM: {
    icon: Book,
    title: 'Hora da Gramática',
    desc: 'Descubra a lógica por trás do idioma — com uma ponte direto pro português',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    accent: '#3b82f6',
    shadow: 'rgba(29, 94, 212, 0.25)',
  },
  VOC: {
    icon: Zap,
    title: 'Vocabulário Novo!',
    desc: 'Imagens, contexto e pronúncia — você não vai esquecer essas palavras',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    accent: '#10b981',
    shadow: 'rgba(5, 150, 105, 0.25)',
  },
  PRON: {
    icon: Mic,
    title: 'Treino de Pronúncia',
    desc: 'Sons que não existem em PT-BR. Impossível? Não para você.',
    gradient: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)',
    accent: '#f97316',
    shadow: 'rgba(194, 65, 12, 0.25)',
  },
  DIAL: {
    icon: MessageSquare,
    title: 'Diálogo do Dia',
    desc: 'Expressões que nativos realmente usam — não o que o livro ensina',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
    accent: '#a855f7',
    shadow: 'rgba(126, 34, 206, 0.25)',
  },
  MISS: {
    icon: Target,
    title: 'Missão Especial',
    desc: 'Uma situação real para você resolver. Você está pronto?',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    accent: '#f59e0b',
    shadow: 'rgba(245, 158, 11, 0.25)',
  },
};

interface LessonIntroScreenProps {
  tag: LessonTag;
  grammarFocus: string;
  language: SupportedLanguage;
  hookReady: boolean;
  onBegin: () => void;
  // onSkip removed from props as it's no longer used here
}

export function LessonIntroScreen({
  tag,
  grammarFocus,
  hookReady,
  onBegin,
}: Omit<LessonIntroScreenProps, 'onSkip'>) {
  const config = TAG_CONFIG[tag];
  const Icon = config.icon;
  const isMission = tag === 'MISS';

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center px-6 overflow-hidden bg-[var(--color-bg)]">
      
      {/* Background decoration (Subtle grid or pattern like dashboard) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--color-text-primary) 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-sm">
        
        {/* Floating Icon Halo */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-[2rem] rotate-12 animate-float shadow-2xl"
            style={{
              background: config.gradient,
              border: '4px solid #fff',
              boxShadow: `0 12px 32px ${config.shadow}`,
            }}
          >
            <Icon size={44} strokeWidth={2.2} className="text-white -rotate-12" />
          </div>
        </div>

        {/* Card Body */}
        <div 
          className="rounded-[3rem] p-8 pt-16 text-center animate-scale-in"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px solid var(--color-border)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
          }}
        >
          {/* Header */}
          <div className="mb-8">
            <span 
              className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3"
              style={{
                backgroundColor: 'var(--color-surface-raised)',
                color: config.accent,
                border: '1px solid var(--color-border)',
              }}
            >
              {isMission ? '🎯 Missão Especial' : tag === 'GRAM' ? '📚 Gramática' : tag === 'VOC' ? '💡 Vocabulário' : tag === 'PRON' ? '🗣️ Pronúncia' : '💬 Diálogo'}
            </span>
            <h1 className="font-display text-3xl font-black text-[var(--color-text-primary)] leading-tight">
              {config.title}
            </h1>
            <p className="mt-3 text-sm font-medium text-[var(--color-text-muted)] leading-relaxed px-2">
              {config.desc}
            </p>
          </div>

          {/* Topic Detail */}
          <div
            className="rounded-2xl p-4 mb-10 text-left transition-all"
            style={{
              backgroundColor: 'var(--color-surface-raised)',
              border: '2px solid var(--color-border)',
            }}
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1">
              Foco da lição
            </p>
            <p className="text-base font-bold text-[var(--color-text-primary)]">
              {grammarFocus}
            </p>
          </div>

          {/* Action Button */}
          <button
            type="button"
            disabled={!hookReady}
            onClick={onBegin}
            className="cta-shimmer relative w-full overflow-hidden rounded-2xl py-4.5 text-base font-black uppercase tracking-widest transition-all active:scale-95 disabled:cursor-not-allowed group"
            style={{
              background: hookReady ? config.gradient : 'var(--color-surface-raised)',
              color: hookReady ? '#fff' : 'var(--color-text-muted)',
              boxShadow: hookReady ? `0 8px 24px ${config.shadow}` : 'none',
              border: hookReady ? 'none' : '2px solid var(--color-border)',
            }}
          >
            {hookReady ? (
              <span className="flex items-center justify-center gap-2">
                Começar lição
                <ChevronRight size={20} strokeWidth={3} className="transition-transform group-hover:translate-x-1" />
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-xs">Sincronizando IA...</span>
              </span>
            )}
          </button>

          {!hookReady && (
            <p className="mt-4 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest animate-pulse">
              Preparamos tudo rapidinho
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

