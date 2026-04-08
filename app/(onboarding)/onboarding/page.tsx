'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, Check, Sparkles, Globe2, Target, User } from 'lucide-react';
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
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i === current;
        const isCompleted = i < current;
        return (
          <div
            key={i}
            className="rounded-full transition-all duration-500 ease-out"
            style={{
              width: isActive ? '24px' : '6px',
              height: '6px',
              backgroundColor: isCompleted
                ? 'var(--color-success)'
                : isActive
                  ? 'var(--color-primary)'
                  : 'var(--color-border)',
            }}
          />
        );
      })}
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
      className="rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95 shadow-sm"
      style={{
        backgroundColor: selected ? 'var(--color-primary-light)' : 'var(--color-surface)',
        borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)',
        color: selected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
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
      className="group relative flex w-full flex-col rounded-2xl border p-5 text-left transition-all duration-300 active:scale-98"
      style={{
        backgroundColor: selected ? 'var(--color-primary-light)' : 'var(--color-surface)',
        borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)',
        transform: selected ? 'scale(1.01)' : 'scale(1)',
        boxShadow: selected
          ? '0 12px 24px rgba(29, 94, 212, 0.1)'
          : '0 2px 8px rgba(0,0,0,0.02)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-3xl transition-transform duration-300 group-hover:scale-110" role="img" aria-label={lang === 'fr' ? 'Bandeira da França' : 'Bandeira do Reino Unido'}>
          {flag}
        </span>
        {selected && (
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full animate-scale-in"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
            }}
          >
            <Check size={14} color="white" strokeWidth={3} />
          </div>
        )}
      </div>
      <h3
        className="font-display text-lg font-bold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {title}
      </h3>
      <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        {description}
      </p>

      <div 
        className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-opacity duration-300"
        style={{ 
          backgroundColor: selected ? 'rgba(29, 94, 212, 0.1)' : 'var(--color-surface-raised)',
          color: selected ? 'var(--color-primary)' : 'var(--color-text-muted)',
          opacity: selected ? 1 : 0.7
        }}
      >
        <Globe2 size={9} />
        {lang === 'fr' ? 'Francês' : 'Inglês'}
      </div>
    </button>
  );
}

function HeroIcon({ children, gradient, icon: Icon }: { children: React.ReactNode; gradient: string; icon: any }) {
  return (
    <div className="relative mb-6 self-start">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-md relative z-10 animate-float"
        style={{ background: gradient }}
      >
        {children}
      </div>
      <div 
        className="absolute -bottom-1 -right-1 h-6 w-6 rounded-lg flex items-center justify-center z-20 shadow-sm animate-scale-in delay-300"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <Icon size={12} style={{ color: 'var(--color-primary)' }} />
      </div>
    </div>
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
      return;
    }
    
    // Check URL for name first
    const searchParams = new URLSearchParams(window.location.search);
    const urlName = searchParams.get('name');
    
    if (urlName && !name) {
      setName(decodeURIComponent(urlName));
    } else if (user?.displayName && !name) {
      // Pre-fill name from Google account if available
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
      router.replace('/dashboard');
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
      className="flex min-h-dvh flex-col overflow-x-hidden"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-32 -right-32 h-64 w-64 rounded-full blur-[80px]"
          style={{ background: 'radial-gradient(circle, rgba(29,94,212,0.1) 0%, transparent 70%)' }}
        />
      </div>

      <header
        className="relative z-10 flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <button
          type="button"
          onClick={() => step > 0 && setStep((s) => s - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 hover:bg-surface active:scale-90"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
            opacity: step === 0 ? 0 : 1,
            pointerEvents: step === 0 ? 'none' : 'auto',
          }}
          aria-label="Voltar"
        >
          <ChevronLeft size={18} />
        </button>

        <StepIndicator current={step} total={TOTAL_STEPS} />

        <div className="w-9 flex justify-end">
          <span className="text-[10px] font-bold tabular-nums" style={{ color: 'var(--color-text-muted)' }}>
            {step + 1}/{TOTAL_STEPS}
          </span>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col px-6 py-6 max-w-md mx-auto w-full md:py-10">

        {/* ── Step 0: Name ── */}
        {step === 0 && (
          <div className="flex flex-col animate-slide-up-spring">
            <HeroIcon gradient="linear-gradient(135deg, #ebf3ff, #d1e3ff)" icon={User}>
              👋
            </HeroIcon>
            <h2
              className="font-display text-2xl font-bold leading-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Qual o seu nome?
            </h2>
            <p className="mt-2 text-sm leading-relaxed mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              Vamos personalizar seu aprendizado para que ele seja único.
            </p>
            <div className="animate-slide-up delay-150 fill-mode-both">
              <Input
                label="Primeiro nome"
                type="text"
                autoComplete="given-name"
                placeholder="Ex: Brunno"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="py-3 px-4 rounded-xl"
              />
            </div>
          </div>
        )}

        {/* ── Step 1: Profession + Goal ── */}
        {step === 1 && (
          <div className="flex flex-col animate-slide-up-spring">
            <HeroIcon gradient="linear-gradient(135deg, #fffbeb, #fef3c7)" icon={Target}>
              🎯
            </HeroIcon>
            <h2
              className="font-display text-2xl font-bold leading-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Conte sobre você
            </h2>
            <p className="mt-2 text-sm leading-relaxed mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              Isso nos ajuda a criar diálogos relevantes para o seu dia a dia.
            </p>

            <div className="flex flex-col gap-6 animate-slide-up delay-150 fill-mode-both">
              <div className="flex flex-col gap-3">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                  Área de atuação
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
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                  Principal objetivo
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
          </div>
        )}

        {/* ── Step 2: Interests ── */}
        {step === 2 && (
          <div className="flex flex-col animate-slide-up-spring">
            <HeroIcon gradient="linear-gradient(135deg, #f0fdf4, #dcfce7)" icon={Sparkles}>
              ✨
            </HeroIcon>
            <h2
              className="font-display text-2xl font-bold leading-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              O que você curte?
            </h2>
            <p className="mt-2 text-sm leading-relaxed mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              Selecione temas que você gosta para seus exercícios.
            </p>

            <div className="grid grid-cols-2 gap-3 animate-slide-up delay-150 fill-mode-both">
              {INTERESTS.map(({ label, emoji }, i) => {
                const selected = interests.includes(label);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleInterest(label)}
                    className={`group flex flex-col items-start rounded-xl border p-3.5 text-left transition-all duration-300 active:scale-95 ${selected ? 'shadow-sm scale-[1.02]' : ''}`}
                    style={{
                      backgroundColor: selected
                        ? 'var(--color-primary-light)'
                        : 'var(--color-surface)',
                      borderColor: selected
                        ? 'var(--color-primary)'
                        : 'var(--color-border)',
                      animationDelay: `${i * 40}ms`
                    }}
                  >
                    <span className="mb-1.5 text-xl transition-transform duration-300 group-hover:scale-110">{emoji}</span>
                    <span
                      className="text-xs font-bold"
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
          <div className="flex flex-col animate-slide-up-spring">
            <HeroIcon gradient="linear-gradient(135deg, #eff6ff, #dbeafe)" icon={Globe2}>
              🌍
            </HeroIcon>
            <h2
              className="font-display text-2xl font-bold leading-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              O que quer dominar?
            </h2>
            <p className="mt-2 text-sm leading-relaxed mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              Escolha seu foco inicial.
            </p>

            <div className="flex flex-col gap-3 animate-slide-up delay-150 fill-mode-both">
              <LanguageCard
                lang="fr"
                flag="🇫🇷"
                title="Francês"
                description="Arte, romance e alta cultura."
                selected={language === 'fr'}
                onClick={() => setLanguage('fr')}
              />
              <LanguageCard
                lang="en"
                flag="🇬🇧"
                title="Inglês"
                description="Carreira e conexões globais."
                selected={language === 'en'}
                onClick={() => setLanguage('en')}
              />
            </div>
          </div>
        )}
      </main>

      <footer
        className="relative z-20 px-6 pb-8 pt-4 max-w-md mx-auto w-full"
      >
        <div className="relative z-10">
          <Button
            variant="primary"
            size="md"
            fullWidth
            disabled={!canAdvance()}
            loading={saving}
            onClick={handleNext}
            className="flex items-center justify-center gap-2 py-3.5 rounded-xl shadow-md transition-all duration-300"
            style={{ 
              boxShadow: canAdvance() ? '0 8px 16px rgba(29, 94, 212, 0.2)' : 'none',
            }}
          >
            {step === TOTAL_STEPS - 1 ? (
              saving ? 'Preparando...' : 'Começar Agora'
            ) : (
              <>
                Continuar
                <ChevronRight size={16} strokeWidth={2.5} />
              </>
            )}
          </Button>

          {step === 0 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Sparkles size={12} style={{ color: 'var(--color-primary)' }} />
              <p
                className="text-[10px] font-semibold"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Personalização inteligente baseada em IA.
              </p>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
