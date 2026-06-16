import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { UserDocument } from '@/types';
import type { CurriculumSyncNotice } from '@/types/curriculumSync';

interface AuthState {
  user: User | null;
  profile: UserDocument | null;
  curriculumSyncNotice: CurriculumSyncNotice | null;
  loading: boolean;
  initialized: boolean;

  setUser: (user: User | null) => void;
  setProfile: (profile: UserDocument | null) => void;
  setCurriculumSyncNotice: (notice: CurriculumSyncNotice | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (v: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  curriculumSyncNotice: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setCurriculumSyncNotice: (curriculumSyncNotice) => set({ curriculumSyncNotice }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
  reset: () =>
    set({
      user: null,
      profile: null,
      curriculumSyncNotice: null,
      loading: false,
      initialized: true,
    }),
}));
