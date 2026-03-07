import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { UserDocument } from '@/types';

interface AuthState {
  user: User | null;
  profile: UserDocument | null;
  loading: boolean;
  initialized: boolean;

  setUser: (user: User | null) => void;
  setProfile: (profile: UserDocument | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (v: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
  reset: () => set({ user: null, profile: null, loading: false, initialized: true }),
}));
