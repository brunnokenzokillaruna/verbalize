'use client';

import { Target, MapPin, AlertTriangle, Clock, Mic, ChevronRight } from 'lucide-react';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import { MissionStepGuide } from '@/components/lesson/mission-roleplay/MissionStepGuide';
import { MISSION_THEME } from '@/components/lesson/mission-roleplay/missionTheme';
import { LessonSceneBanner } from '@/components/lesson/LessonSceneBanner';
import type { MissionBriefingResult, SupportedLanguage, VocabImageResult } from '@/types';

interface LessonMissionScreenProps {
  briefing: MissionBriefingResult;
  language: SupportedLanguage;
  sceneImage?: VocabImageResult | null;
}

export function LessonMissionScreen({
  briefing,
  language,
  sceneImage = null,
}: LessonMissionScreenProps) {
  return (
    <div className="flex flex-col gap-5 sm:gap-6 animate-fade-in">
      {sceneImage?.imageUrl && (
        <LessonSceneBanner
          sceneImage={sceneImage}
          title="Missão"
          subtitle="Situação real — prepare-se"
        />
      )}

      <div className="flex flex-col gap-4 sm:gap-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
              style={{ backgroundColor: MISSION_THEME.accentBg, color: MISSION_THEME.accent }}
            >
              <Target size={22} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-success">
                {MISSION_THEME.label}
              </p>
              <h2 className="font-display text-xl sm:text-2xl font-black leading-tight text-text-primary">
                Briefing
              </h2>
            </div>
          </div>

          {briefing.timePressure && (
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shrink-0 bg-vocab/10 text-vocab border border-vocab/25">
              <Clock size={12} strokeWidth={2.5} />
              <span>{briefing.timePressure}</span>
            </div>
          )}
        </div>

        <MissionStepGuide activeStep="briefing" />
      </div>

      <div
        className="rounded-2xl p-4 sm:p-5 flex gap-3 border-2 border-success"
        style={{ backgroundColor: MISSION_THEME.accentBg }}
      >
        <MapPin size={20} className="shrink-0 mt-0.5 text-success" />
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-success mb-1.5">
            Situação
          </p>
          <p className="grammar-body text-text-primary leading-relaxed">{briefing.scenario}</p>
        </div>
      </div>

      {briefing.stakes && (
        <div className="rounded-2xl p-4 flex gap-3 items-start border border-dashed border-error/35 bg-error/5">
          <AlertTriangle size={18} className="shrink-0 mt-0.5 text-error" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-error mb-1">
              Se você falhar
            </p>
            <p className="grammar-secondary text-text-primary">{briefing.stakes}</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl p-4 sm:p-5 border border-border bg-surface">
        <p className="text-xs font-bold uppercase tracking-wide text-text-muted mb-3">
          Seus objetivos
        </p>
        <div className="flex flex-col gap-3">
          {briefing.objectives.map((obj, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-success text-success">
                <span className="text-[10px] font-black">{i + 1}</span>
              </div>
              <p className="grammar-secondary text-text-primary flex-1">{obj}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
            Frases que você vai precisar
          </p>
          <p className="text-xs text-text-muted mt-1">
            Ouça cada uma antes de entrar na cena.
          </p>
        </div>
        {briefing.keyPhrases.map((phrase, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl p-3.5 sm:p-4 border border-border bg-surface"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/10 text-[10px] font-black text-success">
              {i + 1}
            </span>
            <p className="flex-1 grammar-body font-semibold text-text-primary min-w-0">
              {phrase}
            </p>
            <AudioPlayerButton text={phrase} language={language} size="sm" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-surface-raised/50 px-4 py-3.5 flex items-start gap-3">
        <Mic size={18} className="shrink-0 mt-0.5 text-primary" />
        <div>
          <p className="text-sm font-bold text-text-primary">Próximo passo: entrar em cena</p>
          <p className="grammar-secondary mt-1 flex items-center gap-1">
            Toque em Avançar para começar o role-play
            <ChevronRight size={14} className="shrink-0" />
          </p>
        </div>
      </div>
    </div>
  );
}
