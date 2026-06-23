'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { updateUser } from '@/services/firestore';
import { logOut } from '@/services/auth';
import { ImageCacheManager } from '@/components/admin/ImageCacheManager';
import type { SupportedLanguage } from '@/types';
import type { ImmersionMode } from '@/lib/immersion';

import { ADMIN_EMAIL, PROFESSIONS } from '@/components/profile/constants';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileTabNav, type ProfileTab } from '@/components/profile/ProfileTabNav';
import { ProfileHero } from '@/components/profile/ProfileHero';
import { ProfileLearningSection } from '@/components/profile/ProfileLearningSection';
import { ProfileAccountSection } from '@/components/profile/ProfileAccountSection';
import { MistakesSection } from '@/components/profile/MistakesSection';
import { DeleteAccountSheet } from '@/components/profile/DeleteAccountSheet';
import { SectionLabel } from '@/components/profile/SectionLabel';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, setProfile, reset } = useAuthStore();

  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [name, setName] = useState(profile?.name ?? '');

  const STANDARD_PROFESSIONS = PROFESSIONS.slice(0, -1);
  const initialProfessionPill = STANDARD_PROFESSIONS.includes(profile?.profession ?? '')
    ? (profile?.profession ?? '')
    : profile?.profession
      ? 'Outro'
      : '';
  const [professionPill, setProfessionPill] = useState(initialProfessionPill);
  const [customProfession, setCustomProfession] = useState(
    initialProfessionPill === 'Outro' ? (profile?.profession ?? '') : '',
  );
  const profession = professionPill === 'Outro' ? customProfession.trim() : professionPill;

  const [goal, setGoal] = useState(profile?.languageGoals ?? '');
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [language, setLanguage] = useState<SupportedLanguage>(
    profile?.currentTargetLanguage ?? 'fr',
  );
  const [immersionMode, setImmersionMode] = useState<ImmersionMode>(
    profile?.immersionMode ?? 'auto',
  );

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [mistakeCount, setMistakeCount] = useState(0);

  if (!profile || !user) return null;

  const isDirty =
    name.trim() !== profile.name ||
    profession !== profile.profession ||
    goal !== profile.languageGoals ||
    language !== profile.currentTargetLanguage ||
    immersionMode !== (profile.immersionMode ?? 'auto') ||
    JSON.stringify([...interests].sort()) !==
      JSON.stringify([...(profile.interests ?? [])].sort());

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
        immersionMode,
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
    router.replace('/');
  }

  return (
    <div className="min-h-dvh pb-28 md:pb-16" style={{ backgroundColor: 'var(--color-bg)' }}>
      <ProfileHeader language={language} />

      <main className="mx-auto max-w-lg md:max-w-2xl lg:max-w-4xl px-5 pt-5 flex flex-col gap-5">
        <ProfileTabNav
          activeTab={activeTab}
          mistakeCount={mistakeCount}
          onTabChange={setActiveTab}
        />

        {activeTab === 'overview' && (
          <div className="flex flex-col gap-5">
            <ProfileHero
              profile={{
                ...profile,
                languageGoals: goal || profile.languageGoals,
                interests,
                currentTargetLanguage: language,
              }}
              mistakeCount={mistakeCount}
            />
            <MistakesSection uid={user.uid} onCountChange={setMistakeCount} />
          </div>
        )}

        {activeTab === 'learning' && (
          <ProfileLearningSection
            name={name}
            professionPill={professionPill}
            customProfession={customProfession}
            goal={goal}
            interests={interests}
            language={language}
            onNameChange={setName}
            onProfessionPillChange={setProfessionPill}
            onCustomProfessionChange={setCustomProfession}
            onGoalChange={setGoal}
            onToggleInterest={toggleInterest}
            onLanguageChange={setLanguage}
            immersionMode={immersionMode}
            onImmersionModeChange={setImmersionMode}
          />
        )}

        {activeTab === 'account' && (
          <div className="flex flex-col gap-5">
            <ProfileAccountSection
              onLogout={handleLogout}
              onDelete={() => setShowDeleteSheet(true)}
            />
            {profile.email === ADMIN_EMAIL && (
              <section className="rounded-2xl border border-border bg-surface p-5 flex flex-col gap-4">
                <SectionLabel>Admin · cache de imagens</SectionLabel>
                <ImageCacheManager />
              </section>
            )}
          </div>
        )}
      </main>

      {activeTab === 'learning' && (
        <div
          className="fixed bottom-16 md:bottom-0 left-0 md:left-56 right-0 z-10 px-5 pb-3 pt-2 border-t border-border transition-all duration-300"
          style={{
            backgroundColor: 'var(--color-bg)',
            opacity: isDirty || saving || saveSuccess ? 1 : 0,
            pointerEvents: isDirty || saving || saveSuccess ? 'auto' : 'none',
            transform: isDirty || saving || saveSuccess ? 'translateY(0)' : 'translateY(100%)',
          }}
        >
          <div className="max-w-lg md:max-w-2xl mx-auto">
            <button
              type="button"
              disabled={!isDirty || saving}
              onClick={handleSave}
              className="cta-shimmer relative w-full overflow-hidden rounded-2xl py-3.5 text-sm font-bold transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed cursor-pointer active:translate-y-[2px] text-white"
              style={{
                background: isDirty ? 'var(--color-primary)' : 'var(--color-surface-raised)',
                color: isDirty ? '#fff' : 'var(--color-text-muted)',
                boxShadow: isDirty ? '0 3px 0 var(--color-primary-dark)' : 'none',
              }}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Salvando…
                </span>
              ) : saveSuccess ? (
                <span className="flex items-center justify-center gap-2 animate-scale-in">
                  <Check size={16} strokeWidth={3} />
                  Salvo com sucesso
                </span>
              ) : (
                'Salvar alterações'
              )}
            </button>
          </div>
        </div>
      )}

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
