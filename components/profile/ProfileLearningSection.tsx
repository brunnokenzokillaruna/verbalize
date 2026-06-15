'use client';

import { useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { LanguageFlag } from '@/components/LanguageFlag';
import { SectionLabel } from '@/components/profile/SectionLabel';
import { PROFESSIONS, GOALS, INTERESTS } from '@/components/profile/constants';
import type { SupportedLanguage } from '@/types';

function SelectPill({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer border"
      style={{
        backgroundColor: selected ? 'var(--color-primary-light)' : 'var(--color-surface)',
        borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)',
        color: selected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        boxShadow: selected ? '0 2px 0 var(--color-primary-dark)' : '0 2px 0 var(--color-border)',
      }}
    >
      {label}
    </button>
  );
}

type ProfileLearningSectionProps = {
  name: string;
  professionPill: string;
  customProfession: string;
  goal: string;
  interests: string[];
  language: SupportedLanguage;
  onNameChange: (value: string) => void;
  onProfessionPillChange: (value: string) => void;
  onCustomProfessionChange: (value: string) => void;
  onGoalChange: (value: string) => void;
  onToggleInterest: (label: string) => void;
  onLanguageChange: (lang: SupportedLanguage) => void;
};

export function ProfileLearningSection({
  name,
  professionPill,
  customProfession,
  goal,
  interests,
  language,
  onNameChange,
  onProfessionPillChange,
  onCustomProfessionChange,
  onGoalChange,
  onToggleInterest,
  onLanguageChange,
}: ProfileLearningSectionProps) {
  const [showProfessions, setShowProfessions] = useState(!professionPill);
  const [showGoals, setShowGoals] = useState(!goal);
  const [showInterests, setShowInterests] = useState(interests.length === 0);

  return (
    <div className="flex flex-col gap-5 animate-slide-up-spring">
      {/* Identity */}
      <div className="rounded-2xl border border-border bg-surface p-5 flex flex-col gap-4">
        <SectionLabel>Identidade</SectionLabel>
        <Input
          label="Nome"
          type="text"
          autoComplete="given-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </div>

      {/* Profession */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <button
          type="button"
          onClick={() => setShowProfessions((v) => !v)}
          className="w-full flex items-center justify-between gap-3 p-5 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <div className="min-w-0">
            <SectionLabel>Área de atuação</SectionLabel>
            <p className="text-sm font-semibold text-text-primary mt-1 truncate">
              {professionPill === 'Outro'
                ? customProfession || 'Defina sua profissão'
                : professionPill || 'Selecione uma opção'}
            </p>
          </div>
          {showProfessions ? (
            <ChevronUp size={18} className="text-text-muted shrink-0" />
          ) : (
            <ChevronDown size={18} className="text-text-muted shrink-0" />
          )}
        </button>
        {showProfessions && (
          <div className="px-5 pb-5 flex flex-col gap-3 border-t border-border pt-4 animate-slide-up">
            <div className="flex flex-wrap gap-2">
              {PROFESSIONS.map((p) => (
                <SelectPill
                  key={p}
                  label={p}
                  selected={professionPill === p}
                  onClick={() => {
                    onProfessionPillChange(p);
                    if (p !== 'Outro') onCustomProfessionChange('');
                    if (p !== 'Outro') setShowProfessions(false);
                  }}
                />
              ))}
            </div>
            {professionPill === 'Outro' && (
              <Input
                label="Qual é a sua profissão?"
                type="text"
                value={customProfession}
                onChange={(e) => onCustomProfessionChange(e.target.value)}
              />
            )}
          </div>
        )}
      </div>

      {/* Goal */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <button
          type="button"
          onClick={() => setShowGoals((v) => !v)}
          className="w-full flex items-center justify-between gap-3 p-5 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <div className="min-w-0">
            <SectionLabel>Objetivo principal</SectionLabel>
            <p className="text-sm font-semibold text-text-primary mt-1 truncate">
              {goal || 'O que você quer alcançar?'}
            </p>
          </div>
          {showGoals ? (
            <ChevronUp size={18} className="text-text-muted shrink-0" />
          ) : (
            <ChevronDown size={18} className="text-text-muted shrink-0" />
          )}
        </button>
        {showGoals && (
          <div className="px-5 pb-5 flex flex-wrap gap-2 border-t border-border pt-4 animate-slide-up">
            {GOALS.map((g) => (
              <SelectPill
                key={g}
                label={g}
                selected={goal === g}
                onClick={() => {
                  onGoalChange(g);
                  setShowGoals(false);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Interests */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <button
          type="button"
          onClick={() => setShowInterests((v) => !v)}
          className="w-full flex items-center justify-between gap-3 p-5 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <div className="min-w-0">
            <SectionLabel>Interesses</SectionLabel>
            <p className="text-sm font-semibold text-text-primary mt-1">
              {interests.length > 0
                ? `${interests.length} selecionado${interests.length !== 1 ? 's' : ''}`
                : 'Personalize suas lições'}
            </p>
            {interests.length > 0 && !showInterests && (
              <p className="text-xs text-text-muted mt-1 truncate">
                {interests.join(' · ')}
              </p>
            )}
          </div>
          {showInterests ? (
            <ChevronUp size={18} className="text-text-muted shrink-0" />
          ) : (
            <ChevronDown size={18} className="text-text-muted shrink-0" />
          )}
        </button>
        {showInterests && (
          <div className="px-5 pb-5 grid grid-cols-2 gap-2.5 border-t border-border pt-4 animate-slide-up">
            {INTERESTS.map(({ label, icon: Icon }) => {
              const selected = interests.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => onToggleInterest(label)}
                  className="flex items-center gap-2.5 rounded-xl p-3 text-left transition-all active:scale-[0.98] cursor-pointer border"
                  style={{
                    backgroundColor: selected ? 'var(--color-primary-light)' : 'var(--color-bg)',
                    borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)',
                  }}
                >
                  <span style={{ color: selected ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                    <Icon size={18} />
                  </span>
                  <span
                    className="text-xs font-bold flex-1 min-w-0 truncate"
                    style={{ color: selected ? 'var(--color-primary)' : 'var(--color-text-primary)' }}
                  >
                    {label}
                  </span>
                  {selected && (
                    <span
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      <Check size={9} color="white" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Language */}
      <div className="rounded-2xl border border-border bg-surface p-5 flex flex-col gap-3">
        <SectionLabel>Idioma em aprendizado</SectionLabel>
        <p className="text-xs text-text-muted -mt-2">
          Lições, vocabulário e revisões seguem este idioma.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          {([
            { lang: 'fr' as const, title: 'Francês', sub: 'Français' },
            { lang: 'en' as const, title: 'Inglês', sub: 'English' },
          ]).map(({ lang, title, sub }) => {
            const selected = language === lang;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => onLanguageChange(lang)}
                className="flex flex-1 items-center gap-3 rounded-xl p-4 text-left transition-all active:scale-[0.98] cursor-pointer border-2"
                style={{
                  backgroundColor: selected ? 'var(--color-primary-light)' : 'var(--color-bg)',
                  borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)',
                  boxShadow: selected ? '0 2px 0 var(--color-primary-dark)' : 'none',
                }}
              >
                <LanguageFlag language={lang} size="xl" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-text-primary">{title}</p>
                  <p className="text-xs text-text-muted">{sub}</p>
                </div>
                {selected && (
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    <Check size={12} color="white" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
