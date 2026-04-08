'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, LogOut, Trash2, Check,
  AlertCircle, Loader2, Flame, BookOpen, Target, User,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { updateUser } from '@/services/firestore';
import { logOut } from '@/services/auth';
import { Input } from '@/components/ui/Input';
import { ImageCacheManager } from '@/components/admin/ImageCacheManager';
import type { SupportedLanguage } from '@/types';
import { getEffectiveStreak } from '@/lib/stats';

import { SectionLabel } from '@/components/profile/SectionLabel';
import { MistakesSection } from '@/components/profile/MistakesSection';
import { DeleteAccountSheet } from '@/components/profile/DeleteAccountSheet';

const ADMIN_EMAIL = 'brunnokenzokillaruna@gmail.com';

const PROFESSIONS = [
  'Estudante', 'Tecnologia / TI', 'Saúde', 'Educação',
  'Negócios / Finanças', 'Artes / Comunicação', 'Jurídico', 'Outro',
];

const GOALS = [
  'Viajar com confiança', 'Crescer profissionalmente', 'Estudar no exterior',
  'Acompanhar séries sem legenda', 'Me comunicar com nativos', 'Morar no exterior',
];

const INTERESTS = [
  { label: 'Viagens',       emoji: '✈️' },
  { label: 'Gastronomia',   emoji: '🍽️' },
  { label: 'Música',        emoji: '🎵' },
  { label: 'Cinema & Séries', emoji: '🎬' },
  { label: 'Negócios',      emoji: '💼' },
  { label: 'Tecnologia',    emoji: '💻' },
  { label: 'Literatura',    emoji: '📚' },
  { label: 'Moda & Design', emoji: '🎨' },
];

// ── Sub-components ────────────────────────────────────────────────────────────



function SelectPill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150 active:scale-95"
      style={{
        backgroundColor: selected ? 'var(--color-primary-light)' : 'var(--color-surface)',
        border: `1.5px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
        color: selected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        fontWeight: selected ? 600 : 400,
        boxShadow: selected ? '0 2px 8px rgba(29,94,212,0.15)' : 'none',
      }}
    >
      {label}
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, setProfile, reset } = useAuthStore();

  const [name, setName] = useState(profile?.name ?? '');

  const STANDARD_PROFESSIONS = PROFESSIONS.slice(0, -1);
  const initialProfessionPill = STANDARD_PROFESSIONS.includes(profile?.profession ?? '')
    ? (profile?.profession ?? '')
    : profile?.profession ? 'Outro' : '';
  const [professionPill, setProfessionPill] = useState(initialProfessionPill);
  const [customProfession, setCustomProfession] = useState(
    initialProfessionPill === 'Outro' ? (profile?.profession ?? '') : '',
  );
  const profession = professionPill === 'Outro' ? customProfession.trim() : professionPill;

  const [goal, setGoal] = useState(profile?.languageGoals ?? '');
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [language, setLanguage] = useState<SupportedLanguage>(profile?.currentTargetLanguage ?? 'fr');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);

  if (!profile || !user) return null;

  const isDirty =
    name.trim() !== profile.name ||
    profession !== profile.profession ||
    goal !== profile.languageGoals ||
    language !== profile.currentTargetLanguage ||
    JSON.stringify([...interests].sort()) !== JSON.stringify([...(profile.interests ?? [])].sort());

  const initials = profile.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  function toggleInterest(label: string) {
    setInterests((prev) => prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]);
  }

  async function handleSave() {
    if (!user || !profile || !isDirty || saving) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const updates = { name: name.trim(), profession, languageGoals: goal, interests, currentTargetLanguage: language };
      await updateUser(user.uid, updates);
      setProfile({ ...profile, ...updates });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logOut();
    reset();
    router.replace('/');
  }



  return (
    <div className="min-h-dvh pb-40 md:pb-24" style={{ backgroundColor: 'var(--color-bg)' }}>

      {/* ── Sticky header ── */}
      <header
        className="sticky top-0 z-10 px-5 py-4"
        style={{
          backgroundColor: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-border)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-lg md:max-w-2xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl transition-all active:scale-90"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
            aria-label="Voltar"
          >
            <ChevronLeft size={18} />
          </button>
          <h1 className="font-display text-xl font-bold flex-1" style={{ color: 'var(--color-text-primary)' }}>
            Perfil
          </h1>
        </div>
      </header>

      <main className="px-5 py-6 max-w-lg md:max-w-2xl mx-auto flex flex-col gap-8">

        {/* ── Hero: avatar + stats ── */}
        <div className="animate-slide-up-spring">
          {/* Avatar card */}
          <div
            className="relative overflow-hidden rounded-3xl p-6"
            style={{
              background: 'linear-gradient(135deg, #0a1628 0%, #1d5ed4 100%)',
              boxShadow: '0 12px 40px rgba(29,94,212,0.25)',
            }}
          >
            {/* Diagonal pattern */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
                backgroundSize: '16px 16px',
              }}
            />
            <div
              className="pointer-events-none absolute -right-8 -bottom-8 h-40 w-40 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.2) 0%, transparent 70%)' }}
            />

            <div className="relative flex items-center gap-4">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
              >
                <span className="font-display text-2xl font-bold text-white">{initials}</span>
              </div>
              <div className="min-w-0">
                <p className="font-display text-xl font-bold text-white leading-tight truncate">
                  {profile.name}
                </p>
                <p className="text-sm mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {profile.email}
                </p>
              </div>
            </div>

            {/* Stats strip */}
            <div className="relative mt-5 grid grid-cols-2 gap-3">
              <div
                className="flex items-center gap-2.5 rounded-2xl px-4 py-3"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                <Flame size={18} style={{ color: '#fbbf24' }} />
                <div>
                  {(() => {
                    const currentStreak = getEffectiveStreak(profile);
                    return (
                      <>
                        <p className="text-lg font-bold leading-none text-white">{currentStreak}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {currentStreak === 1 ? 'dia seguido' : 'dias seguidos'}
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>
              <div
                className="flex items-center gap-2.5 rounded-2xl px-4 py-3"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                <BookOpen size={18} style={{ color: '#60a5fa' }} />
                <div>
                  <p className="text-lg font-bold leading-none text-white">{profile.totalLessonsCompleted}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {profile.totalLessonsCompleted === 1 ? 'lição' : 'lições'} concluída{profile.totalLessonsCompleted !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Dados pessoais ── */}
        <section className="flex flex-col gap-5 animate-slide-up-spring delay-75">
          <div className="flex items-center gap-3">
            <User size={14} style={{ color: 'var(--color-text-muted)' }} />
            <SectionLabel>Dados pessoais</SectionLabel>
          </div>

          <Input label="Nome" type="text" autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} />

          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Área de atuação</p>
            <div className="flex flex-wrap gap-2">
              {PROFESSIONS.map((p) => (
                <SelectPill
                  key={p} label={p} selected={professionPill === p}
                  onClick={() => { setProfessionPill(p); if (p !== 'Outro') setCustomProfession(''); }}
                />
              ))}
            </div>
            {professionPill === 'Outro' && (
              <Input label="Qual é a sua profissão?" type="text" value={customProfession} onChange={(e) => setCustomProfession(e.target.value)} />
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Target size={14} style={{ color: 'var(--color-text-muted)' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Objetivo principal</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <SelectPill key={g} label={g} selected={goal === g} onClick={() => setGoal(g)} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Interesses ── */}
        <section className="flex flex-col gap-4 animate-slide-up-spring delay-150">
          <SectionLabel>Interesses</SectionLabel>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {INTERESTS.map(({ label, emoji }) => {
              const selected = interests.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleInterest(label)}
                  className="card-lift flex flex-col items-start rounded-2xl p-4 text-left transition-all duration-150 active:scale-95"
                  style={{
                    backgroundColor: selected ? 'var(--color-primary-light)' : 'var(--color-surface)',
                    border: `1.5px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    boxShadow: selected ? '0 4px 12px rgba(29,94,212,0.15)' : 'none',
                  }}
                >
                  <span className="mb-2 text-2xl">{emoji}</span>
                  <span className="text-sm font-semibold" style={{ color: selected ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                    {label}
                  </span>
                  {selected && (
                    <span
                      className="mt-1.5 flex h-4 w-4 items-center justify-center rounded-full"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      <Check size={9} color="white" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Idioma ── */}
        <section className="flex flex-col gap-4 animate-slide-up-spring delay-225">
          <SectionLabel>Idioma em aprendizado</SectionLabel>
          <div className="flex flex-col md:flex-row gap-3">
            {([
              { lang: 'fr', flag: '🇫🇷', title: 'Francês', sub: 'Français' },
              { lang: 'en', flag: '🇬🇧', title: 'Inglês',  sub: 'English'  },
            ] as const).map(({ lang, flag, title, sub }) => {
              const selected = language === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className="card-lift flex flex-1 items-center gap-4 rounded-2xl p-4 text-left transition-all duration-150 active:scale-95"
                  style={{
                    backgroundColor: selected ? 'var(--color-primary-light)' : 'var(--color-surface)',
                    border: `2px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    boxShadow: selected ? '0 4px 16px rgba(29,94,212,0.2)' : 'none',
                  }}
                >
                  <span className="text-3xl">{flag}</span>
                  <div className="flex-1">
                    <p className="font-bold text-sm" style={{ color: selected ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>{title}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{sub}</p>
                  </div>
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-200"
                    style={{
                      background: selected ? 'linear-gradient(135deg, var(--color-primary), #60a5fa)' : 'var(--color-surface-raised)',
                      border: selected ? 'none' : '1.5px solid var(--color-border)',
                    }}
                  >
                    {selected && <Check size={12} color="white" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Erros para revisar ── */}
        <MistakesSection uid={user.uid} />

        {/* ── Admin ── */}
        {profile.email === ADMIN_EMAIL && (
          <section className="flex flex-col gap-4 animate-slide-up-spring delay-375">
            <SectionLabel>Gerenciar imagens de vocabulário</SectionLabel>
            <ImageCacheManager />
          </section>
        )}

        {/* ── Conta ── */}
        <section className="flex flex-col gap-3 animate-slide-up-spring delay-450">
          <SectionLabel>Conta</SectionLabel>
          <button
            type="button"
            onClick={handleLogout}
            className="card-lift flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-all active:scale-95"
            style={{ backgroundColor: 'var(--color-surface)', border: '1.5px solid var(--color-border)' }}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: 'var(--color-surface-raised)' }}
            >
              <LogOut size={16} style={{ color: 'var(--color-text-muted)' }} />
            </span>
            <span className="flex-1 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
              Sair da conta
            </span>
            <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteSheet(true)}
            className="card-lift flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-all active:scale-95"
            style={{ backgroundColor: 'var(--color-error-bg)', border: '1.5px solid rgba(220,38,38,0.25)' }}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: 'rgba(220,38,38,0.15)' }}
            >
              <Trash2 size={16} style={{ color: 'var(--color-error)' }} />
            </span>
            <span className="flex-1 font-semibold text-sm" style={{ color: 'var(--color-error)' }}>
              Excluir conta
            </span>
            <ChevronRight size={16} style={{ color: 'var(--color-error)', opacity: 0.5 }} />
          </button>
        </section>
      </main>

      {/* ── Sticky save bar ── */}
      <div
        className="fixed bottom-16 md:bottom-0 left-0 md:left-56 right-0 z-10 px-5 pb-3 pt-2"
        style={{ backgroundColor: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}
      >
        <div className="max-w-lg md:max-w-2xl mx-auto">
          <button
            type="button"
            disabled={!isDirty || saving}
            onClick={handleSave}
            className="cta-shimmer relative w-full overflow-hidden rounded-2xl py-3.5 text-sm font-bold text-white transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed"
            style={{
              background: isDirty
                ? 'linear-gradient(135deg, var(--color-primary) 0%, #2563eb 100%)'
                : 'var(--color-surface-raised)',
              color: isDirty ? '#fff' : 'var(--color-text-muted)',
              boxShadow: isDirty ? '0 6px 20px rgba(29,94,212,0.3)' : 'none',
            }}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Salvando…
              </span>
            ) : saveSuccess ? (
              <span className="flex items-center justify-center gap-2">
                <Check size={16} strokeWidth={3} />
                Salvo com sucesso!
              </span>
            ) : (
              'Salvar alterações'
            )}
          </button>
        </div>
      </div>

      {/* ── Delete bottom sheet ── */}
      {showDeleteSheet && (
        <DeleteAccountSheet
          user={user}
          onClose={() => setShowDeleteSheet(false)}
          onReset={reset}
        />
      )}
    </div>
  );
}
