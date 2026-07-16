'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import type { LessonTag, VocabImageResult } from '@/types';

const TAG_CONFIG: Record<LessonTag, { title: string; desc: string; emoji: string }> = {
  GRAM: {
    title: 'Hora da Gramática',
    desc: 'Descubra a lógica por trás do idioma — com uma ponte direto pro português',
    emoji: '🧠',
  },
  VOC: {
    title: 'Vocabulário Novo!',
    desc: 'Imagens, contexto e pronúncia — você não vai esquecer essas palavras',
    emoji: '🧩',
  },
  PRON: {
    title: 'Treino de Pronúncia',
    desc: 'Sons que não existem em PT-BR. Impossível? Não para você.',
    emoji: '🗣️',
  },
  DIAL: {
    title: 'Diálogo do Dia',
    desc: 'Expressões que nativos realmente usam — não o que o livro ensina',
    emoji: '💬',
  },
  MISS: {
    title: 'Missão Especial',
    desc: 'Uma situação real para você resolver. Você está pronto?',
    emoji: '🎯',
  },
  VERB: {
    title: 'Treino de Verbos',
    desc: 'Conjugações, tempos e modos — dominando a espinha dorsal da frase',
    emoji: '🔁',
  },
  EXPR: {
    title: 'Expressões Vivas',
    desc: 'Idiomatismos e gírias que só quem mora lá conhece de verdade',
    emoji: '✨',
  },
  CULT: {
    title: 'Imersão Cultural',
    desc: 'Literatura, história e o modo de pensar do mundo francófono',
    emoji: '🌍',
  },
  REVIEW: {
    title: 'Checkpoint',
    desc: 'Hora de provar o que você aprendeu — compreensão e produção sem dicas',
    emoji: '🏁',
  },
};

interface LessonIntroScreenProps {
  tag: LessonTag;
  grammarFocus: string;
  uiTitle?: string;
  hookReady: boolean;
  sceneImage: VocabImageResult | null;
}

export function LessonIntroScreen({
  tag,
  grammarFocus,
  uiTitle,
  hookReady,
  sceneImage,
}: LessonIntroScreenProps) {
  const config = TAG_CONFIG[tag];
  const headline = uiTitle?.trim() || config.title;
  const [imageFailed, setImageFailed] = useState(false);
  const [useNativeImage, setUseNativeImage] = useState(false);
  const showImage = !!sceneImage?.imageUrl && !imageFailed;
  const usePexelsDirect = !!sceneImage?.imageUrl?.includes('pexels.com');

  return (
    <div className="flex flex-col gap-5 sm:gap-6 animate-slide-up-spring">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface border border-border border-b-[3px] text-lg shadow-sm">
            {config.emoji}
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="font-display text-xl sm:text-2xl font-black italic tracking-tight text-text-primary leading-tight">
              {headline}
            </h2>
            <p className="text-xs font-semibold text-text-muted mt-1 leading-snug">
              {config.desc}
            </p>
          </div>
        </div>
      </div>

      <div
        className="relative w-full overflow-hidden rounded-2xl border border-border border-b-[3px] aspect-[16/10] sm:aspect-[16/9] max-h-56 sm:max-h-64 md:max-h-72"
        style={{ backgroundColor: 'var(--color-surface-raised)' }}
      >
        {showImage ? (
          useNativeImage || usePexelsDirect ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sceneImage!.imageUrl}
              alt={sceneImage!.imageAlt ?? headline}
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <Image
              src={sceneImage!.imageUrl}
              alt={sceneImage!.imageAlt ?? headline}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 672px, 896px"
              onError={() => setUseNativeImage(true)}
            />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--color-surface-raised)] to-[var(--color-surface)]">
            <Loader2 size={28} className="animate-spin text-primary opacity-50" />
          </div>
        )}
      </div>

      <div className="rounded-2xl p-4 sm:p-5 border border-border border-b-[3px] bg-surface">
        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1.5">
          Foco da lição
        </p>
        <p className="text-base sm:text-lg font-bold text-text-primary leading-snug">
          {grammarFocus}
        </p>
      </div>

      {!hookReady && (
        <div className="flex items-center gap-3 rounded-2xl px-4 py-3 border border-border bg-surface animate-pulse">
          <Loader2 size={16} className="animate-spin text-primary shrink-0" />
          <p className="text-xs font-semibold text-text-muted">
            Preparando o conteúdo da lição…
          </p>
        </div>
      )}
    </div>
  );
}
