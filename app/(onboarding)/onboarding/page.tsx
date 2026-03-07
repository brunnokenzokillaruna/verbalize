'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { createUser } from '@/services/firestore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { SupportedLanguage } from '@/types';

// ─── Data ─────────────────────────────────────────────────────────────────────

const PROFESSIONS = [
  'Estudante',
  'Tecnologia / TI',
  'Saúde',
  'Educação',
  'Negócios / Finanças',
  'Artes / Comunicação',
  'Jurídico',
  'Outro',
];

const GOALS = [
  'Viajar com confiança',
  'Crescer profissionalmente',
  'Estudar no exterior',
  'Acompanhar séries sem legenda',
  'Me comunicar com nativos',
  'Morar no exterior',
];

const INTERESTS = [
  { label: 'Viagens', emoji: '✈️' },
  { label: 'Gastronomia', emoji: '🍽️' },
  { label: 'Música', emoji: '🎵' },
  { label: 'Cinema & Séries', emoji: '🎬' },
  { label: 'Negócios', emoji: '💼' },
  { label: 'Tecnologia', emoji: '💻' },
  { label: 'Literatura', emoji: '📚' },
  { label: 'Moda & Design', emoji: '🎨' },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === current ? '24px' : '8px',
            height: '8px',
            backgroundColor:
              i < current
                ? 'var(--color-success)'
                : i === current
                  ? 'var(--color-primary)'
                  : 'var(--color-border-strong)',
          }}
        />
      ))}
    </div>
  );
}

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
      className="rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all duration-150 active:scale-95"
      style={{
        backgroundColor: selected ? 'var(--color-primary-light)' : 'var(--color-surface)',
        borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)',
        color: selected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        fontWeight: selected ? 600 : 400,
      }}
    >
      {label}
    </button>
  );
}

function LanguageCard({
  lang,
  flag,
  title,
  description,
  selected,
  onClick,
}: {
  lang: SupportedLanguage;
  flag: string;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex w-full flex-col rounded-3xl border-2 p-6 text-left transition-all duration-200 active:scale-98"
      style={{
        backgroundColor: selected ? 'var(--color-primary-light)' : 'var(--color-surface)',
        borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
        boxShadow: selected
          ? '0 8px 24px rgba(29, 94, 212, 0.15)'
          : '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {selected && (
        <span
          className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Check size={14} color="white" strokeWidth={3} />
        </span>
      )}
      <span className="mb-3 text-4xl" role="img" aria-label={lang === 'fr' ? 'Bandeira da França' : 'Bandeira do Reino Unido'}>
        {flag}
      </span>
      <h3
        className="font-display text-xl font-semibold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        {description}
      </p>
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, initialized, setProfile } = useAuthStore();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  const [goal, setGoal] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [language, setLanguage] = useState<SupportedLanguage | ''>('');

  // Guard: redirect if not authenticated
  useEffect(() => {
    if (initialized && !user) {
      router.replace('/login');
    }
    // Pre-fill name from Google account if available
    if (user?.displayName && !name) {
      setName(user.displayName.split(' ')[0]);
    }
  }, [initialized, user, router, user?.displayName, name]);

  function toggleInterest(label: string) {
    setInterests((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label],
    );
  }

  function canAdvance() {
    if (step === 0) return name.trim().length >= 2;
    if (step === 1) return profession !== '' && goal !== '';
    if (step === 2) return interests.length >= 1;
    if (step === 3) return language !== '';
    return false;
  }

  async function handleFinish() {
    if (!user || language === '') return;
    setSaving(true);
    try {
      await createUser(user.uid, {
        email: user.email ?? '',
        name: name.trim(),
        profession,
        interests,
        languageGoals: goal,
        currentTargetLanguage: language,
        currentStreak: 0,
        totalLessonsCompleted: 0,
      });
      // Re-fetch profile and store it
      const { getUser } = await import('@/services/firestore');
      const profile = await getUser(user.uid);
      setProfile(profile);
      router.replace('/');
    } catch {
      setSaving(false);
    }
  }

  function handleNext() {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      handleFinish();
    }
  }

  if (!initialized || !user) return null;

  return (
    <div
      className="flex min-h-dvh flex-col"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <button
          type="button"
          onClick={() => step > 0 && setStep((s) => s - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-opacity"
          style={{
            color: 'var(--color-text-muted)',
            opacity: step === 0 ? 0 : 1,
            pointerEvents: step === 0 ? 'none' : 'auto',
          }}
          aria-label="Voltar"
        >
          <ChevronLeft size={22} />
        </button>

        <StepIndicator current={step} total={TOTAL_STEPS} />

        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {step + 1}/{TOTAL_STEPS}
        </span>
      </header>

      {/* Step content */}
      <main className="flex flex-1 flex-col px-6 py-8 max-w-lg mx-auto w-full">

        {/* ── Step 0: Name ── */}
        {step === 0 && (
          <div className="flex flex-col gap-8 animate-slide-in">
            <div>
              <div
                className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
                style={{ backgroundColor: 'var(--color-primary-light)' }}
              >
                👋
              </div>
              <h2
                className="font-display text-3xl font-semibold leading-tight"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Olá! Como podemos te chamar?
              </h2>
              <p className="mt-2 text-base" style={{ color: 'var(--color-text-secondary)' }}>
                Vamos personalizar sua experiência de aprendizado.
              </p>
            </div>
            <Input
              label="Seu primeiro nome"
              type="text"
              autoComplete="given-name"
              placeholder="Ex: Maria"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {/* ── Step 1: Profession + Goal ── */}
        {step === 1 && (
          <div className="flex flex-col gap-8 animate-slide-in">
            <div>
              <div
                className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
                style={{ backgroundColor: 'var(--color-primary-light)' }}
              >
                🎯
              </div>
              <h2
                className="font-display text-3xl font-semibold leading-tight"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Conte-nos um pouco sobre você
              </h2>
              <p className="mt-2 text-base" style={{ color: 'var(--color-text-secondary)' }}>
                Isso ajuda a criar lições mais relevantes para o seu dia a dia.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Qual é sua área de atuação?
              </p>
              <div className="flex flex-wrap gap-2">
                {PROFESSIONS.map((p) => (
                  <SelectPill
                    key={p}
                    label={p}
                    selected={profession === p}
                    onClick={() => setProfession(p)}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Qual é seu principal objetivo?
              </p>
              <div className="flex flex-wrap gap-2">
                {GOALS.map((g) => (
                  <SelectPill
                    key={g}
                    label={g}
                    selected={goal === g}
                    onClick={() => setGoal(g)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Interests ── */}
        {step === 2 && (
          <div className="flex flex-col gap-8 animate-slide-in">
            <div>
              <div
                className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
                style={{ backgroundColor: 'var(--color-primary-light)' }}
              >
                ✨
              </div>
              <h2
                className="font-display text-3xl font-semibold leading-tight"
                style={{ color: 'var(--color-text-primary)' }}
              >
                O que você curte?
              </h2>
              <p className="mt-2 text-base" style={{ color: 'var(--color-text-secondary)' }}>
                Selecione pelo menos um interesse. As histórias serão baseadas neles.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {INTERESTS.map(({ label, emoji }) => {
                const selected = interests.includes(label);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleInterest(label)}
                    className="flex flex-col items-start rounded-2xl border p-4 text-left transition-all duration-150 active:scale-95"
                    style={{
                      backgroundColor: selected
                        ? 'var(--color-primary-light)'
                        : 'var(--color-surface)',
                      borderColor: selected
                        ? 'var(--color-primary)'
                        : 'var(--color-border)',
                    }}
                  >
                    <span className="mb-1.5 text-2xl">{emoji}</span>
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: selected
                          ? 'var(--color-primary)'
                          : 'var(--color-text-primary)',
                      }}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 3: Language selection ── */}
        {step === 3 && (
          <div className="flex flex-col gap-8 animate-slide-in">
            <div>
              <div
                className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
                style={{ backgroundColor: 'var(--color-primary-light)' }}
              >
                🌍
              </div>
              <h2
                className="font-display text-3xl font-semibold leading-tight"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Qual idioma você quer aprender?
              </h2>
              <p className="mt-2 text-base" style={{ color: 'var(--color-text-secondary)' }}>
                Você poderá adicionar o segundo idioma depois.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <LanguageCard
                lang="fr"
                flag="🇫🇷"
                title="Francês"
                description="Conecte-se ao mundo da arte, gastronomia e cultura. Ideal para quem quer viver ou viajar pela Europa."
                selected={language === 'fr'}
                onClick={() => setLanguage('fr')}
              />
              <LanguageCard
                lang="en"
                flag="🇬🇧"
                title="Inglês"
                description="O idioma global dos negócios, tecnologia e entretenimento. Essencial para qualquer carreira internacional."
                selected={language === 'en'}
                onClick={() => setLanguage('en')}
              />
            </div>
          </div>
        )}
      </main>

      {/* Sticky bottom CTA */}
      <footer
        className="px-6 pb-8 pt-4 max-w-lg mx-auto w-full"
        style={{ borderTop: '1px solid var(--color-border)' }}
      >
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canAdvance()}
          loading={saving}
          onClick={handleNext}
          className="flex items-center justify-center gap-2"
        >
          {step === TOTAL_STEPS - 1 ? (
            saving ? 'Salvando...' : 'Começar a aprender'
          ) : (
            <>
              Continuar
              <ChevronRight size={18} />
            </>
          )}
        </Button>

        {step === 0 && (
          <p
            className="mt-4 text-center text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Seus dados são usados apenas para personalizar lições.
          </p>
        )}
      </footer>
    </div>
  );
}
