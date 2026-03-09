'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, LogOut, Trash2, Check } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { updateUser, deleteUserData } from '@/services/firestore';
import { logOut, deleteAccount } from '@/services/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { SupportedLanguage } from '@/types';

// ─── Data (mirrors onboarding) ────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs font-semibold uppercase tracking-widest"
      style={{ color: 'var(--color-text-muted)' }}
    >
      {children}
    </p>
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, setProfile, reset } = useAuthStore();

  const [name, setName] = useState(profile?.name ?? '');
  const [profession, setProfession] = useState(profile?.profession ?? '');
  const [goal, setGoal] = useState(profile?.languageGoals ?? '');
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [language, setLanguage] = useState<SupportedLanguage>(
    profile?.currentTargetLanguage ?? 'fr',
  );

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  if (!profile || !user) return null;

  const isDirty =
    name.trim() !== profile.name ||
    profession !== profile.profession ||
    goal !== profile.languageGoals ||
    language !== profile.currentTargetLanguage ||
    JSON.stringify([...interests].sort()) !== JSON.stringify([...(profile.interests ?? [])].sort());

  const initials = profile.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  function toggleInterest(label: string) {
    setInterests((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label],
    );
  }

  async function handleSave() {
    if (!user || !profile || !isDirty || saving) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const updates = {
        name: name.trim(),
        profession,
        languageGoals: goal,
        interests,
        currentTargetLanguage: language,
      };
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
    router.replace('/login');
  }

  async function handleDeleteAccount() {
    if (!user) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteUserData(user.uid);
      await deleteAccount(user);
      reset();
      router.replace('/login');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/requires-recent-login') {
        setDeleteError(
          'Por segurança, saia e faça login novamente antes de excluir sua conta.',
        );
      } else {
        setDeleteError('Erro ao excluir conta. Tente novamente.');
      }
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-dvh pb-28" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 max-w-lg mx-auto"
        style={{ backgroundColor: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-opacity active:opacity-60"
          style={{ color: 'var(--color-text-secondary)' }}
          aria-label="Voltar"
        >
          <ChevronLeft size={22} />
        </button>
        <h1
          className="font-display text-xl font-semibold flex-1"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Perfil
        </h1>
      </header>

      <main className="px-5 py-6 max-w-lg mx-auto flex flex-col gap-8">

        {/* ── Avatar + email ── */}
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-inverse)' }}
          >
            <span className="font-display text-2xl font-bold">{initials}</span>
          </div>
          <div>
            <p
              className="font-display text-lg font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {profile.name}
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {profile.email}
            </p>
          </div>
        </div>

        {/* ── Dados pessoais ── */}
        <section className="flex flex-col gap-5">
          <SectionLabel>Dados pessoais</SectionLabel>

          <Input
            label="Nome"
            type="text"
            autoComplete="given-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
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
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Objetivo principal
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
        </section>

        {/* ── Interesses ── */}
        <section className="flex flex-col gap-4">
          <SectionLabel>Interesses</SectionLabel>
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
                    backgroundColor: selected ? 'var(--color-primary-light)' : 'var(--color-surface)',
                    borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)',
                  }}
                >
                  <span className="mb-1.5 text-2xl">{emoji}</span>
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: selected ? 'var(--color-primary)' : 'var(--color-text-primary)',
                    }}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Idioma ── */}
        <section className="flex flex-col gap-4">
          <SectionLabel>Idioma em aprendizado</SectionLabel>
          <div className="flex flex-col gap-3">
            {(
              [
                { lang: 'fr', flag: '🇫🇷', title: 'Francês' },
                { lang: 'en', flag: '🇬🇧', title: 'Inglês' },
              ] as const
            ).map(({ lang, flag, title }) => {
              const selected = language === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className="flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-150 active:scale-95"
                  style={{
                    backgroundColor: selected ? 'var(--color-primary-light)' : 'var(--color-surface)',
                    borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)',
                  }}
                >
                  <span className="text-3xl" role="img" aria-label={title}>
                    {flag}
                  </span>
                  <span
                    className="flex-1 font-semibold"
                    style={{ color: selected ? 'var(--color-primary)' : 'var(--color-text-primary)' }}
                  >
                    {title}
                  </span>
                  {selected && (
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      <Check size={14} color="white" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Conta ── */}
        <section className="flex flex-col gap-3">
          <SectionLabel>Conta</SectionLabel>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all active:scale-95"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            <LogOut size={18} style={{ color: 'var(--color-text-muted)' }} />
            <span className="font-medium">Sair da conta</span>
          </button>
          <button
            type="button"
            onClick={() => { setDeleteError(''); setShowDeleteSheet(true); }}
            className="flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all active:scale-95"
            style={{
              backgroundColor: 'var(--color-error-bg)',
              borderColor: 'var(--color-error)',
              color: 'var(--color-error)',
            }}
          >
            <Trash2 size={18} />
            <span className="font-medium">Excluir conta</span>
          </button>
        </section>
      </main>

      {/* ── Sticky save button ── */}
      <div
        className="fixed bottom-16 left-0 right-0 z-10 mx-auto max-w-[640px] px-5 pb-3 pt-2"
        style={{ backgroundColor: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}
      >
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!isDirty}
          loading={saving}
          onClick={handleSave}
        >
          {saveSuccess ? (
            <span className="flex items-center justify-center gap-2">
              <Check size={16} strokeWidth={3} />
              Salvo!
            </span>
          ) : (
            'Salvar alterações'
          )}
        </Button>
      </div>

      {/* ── Delete confirmation bottom sheet ── */}
      {showDeleteSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteSheet(false); }}
        >
          <div
            className="w-full max-w-lg mx-auto rounded-t-3xl px-6 pb-10 pt-6 flex flex-col gap-5"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div
              className="mx-auto h-1 w-10 rounded-full"
              style={{ backgroundColor: 'var(--color-border-strong)' }}
            />
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ backgroundColor: 'var(--color-error-bg)' }}
            >
              <Trash2 size={22} style={{ color: 'var(--color-error)' }} />
            </div>
            <div>
              <h2
                className="font-display text-xl font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Excluir conta?
              </h2>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                Todo o seu progresso, vocabulário e histórico de lições serão apagados permanentemente. Essa ação não pode ser desfeita.
              </p>
            </div>
            {deleteError && (
              <p className="text-sm rounded-xl px-4 py-3" style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)' }}>
                {deleteError}
              </p>
            )}
            <Button
              variant="danger"
              size="lg"
              fullWidth
              loading={deleting}
              onClick={handleDeleteAccount}
            >
              Excluir definitivamente
            </Button>
            <button
              type="button"
              onClick={() => setShowDeleteSheet(false)}
              className="text-center text-sm font-medium py-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
