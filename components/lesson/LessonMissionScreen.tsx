'use client';

import { Target, MapPin, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import type { MissionBriefingResult, SupportedLanguage } from '@/types';

interface LessonMissionScreenProps {
  briefing: MissionBriefingResult;
  language: SupportedLanguage;
}

export function LessonMissionScreen({ briefing, language }: LessonMissionScreenProps) {
  return (
    <div className="flex flex-col gap-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}
          >
            <Target size={22} strokeWidth={2} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-success)' }}>
              Missão Especial
            </p>
            <h2 className="text-xl font-black leading-tight" style={{ color: 'var(--color-text-primary)' }}>
              Briefing da Missão
            </h2>
          </div>
        </div>

        {briefing.timePressure && (
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider shrink-0"
            style={{
              backgroundColor: 'rgba(217,119,6,0.1)',
              color: 'var(--color-vocab)',
              border: '1.5px solid rgba(217,119,6,0.3)',
            }}
          >
            <Clock size={11} strokeWidth={2.5} />
            <span className="leading-none">{briefing.timePressure}</span>
          </div>
        )}
      </div>

      {/* Scenario */}
      <div
        className="rounded-2xl p-4 flex gap-3"
        style={{
          backgroundColor: 'var(--color-success-bg)',
          border: '2px solid var(--color-success)',
        }}
      >
        <MapPin size={20} className="shrink-0 mt-0.5" style={{ color: 'var(--color-success)' }} />
        <div>
          <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: 'var(--color-success)' }}>
            📍 Situação
          </p>
          <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
            {briefing.scenario}
          </p>
        </div>
      </div>

      {/* Stakes — what's at risk if you fail */}
      {briefing.stakes && (
        <div
          className="rounded-2xl p-3.5 flex gap-3 items-start"
          style={{
            backgroundColor: 'rgba(239,68,68,0.06)',
            border: '1.5px dashed rgba(239,68,68,0.4)',
          }}
        >
          <AlertTriangle size={18} className="shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
          <div>
            <p
              className="text-[10px] font-black uppercase tracking-wider mb-0.5"
              style={{ color: '#ef4444' }}
            >
              Se você falhar
            </p>
            <p className="text-sm leading-snug" style={{ color: 'var(--color-text-primary)' }}>
              {briefing.stakes}
            </p>
          </div>
        </div>
      )}

      {/* Objectives */}
      <div
        className="rounded-2xl p-4"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '2px solid var(--color-border)',
        }}
      >
        <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
          Seus Objetivos
        </p>
        <div className="flex flex-col gap-2.5">
          {briefing.objectives.map((obj, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                style={{ border: '2px solid var(--color-success)', color: 'var(--color-success)' }}
              >
                <span className="text-[9px] font-black">{i + 1}</span>
              </div>
              <p className="text-sm leading-snug" style={{ color: 'var(--color-text-primary)' }}>
                {obj}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Phrases */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
          Frases que você vai precisar
        </p>
        {briefing.keyPhrases.map((phrase, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl p-4"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '2px solid var(--color-border)',
            }}
          >
            <CheckCircle2 size={16} className="shrink-0" style={{ color: 'var(--color-success)' }} />
            <p className="flex-1 text-sm font-semibold italic" style={{ color: 'var(--color-text-primary)' }}>
              {phrase}
            </p>
            <AudioPlayerButton text={phrase} language={language} size="sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
