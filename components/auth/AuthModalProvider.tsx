'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

type ModalType = 'login' | 'signup' | null;

interface AuthModalContextProps {
  modalType: ModalType;
  openModal: (type: ModalType) => void;
  closeModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextProps | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [modalType, setModalType] = useState<ModalType>(null);

  const openModal = (type: ModalType) => setModalType(type);
  const closeModal = () => setModalType(null);

  useEffect(() => {
    if (!modalType) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [modalType]);

  return (
    <AuthModalContext.Provider value={{ modalType, openModal, closeModal }}>
      {children}

      {modalType && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4"
          onClick={closeModal}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={modalType === 'login' ? 'Entrar na conta' : 'Criar conta'}
            className="relative w-full max-w-md max-h-[min(90dvh,720px)] overflow-y-auto overscroll-contain scrollbar-hide animate-scale-in rounded-2xl sm:rounded-3xl shadow-2xl px-4 pt-12 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8 sm:pt-12 sm:pb-8 lg:px-10 [-webkit-overflow-scrolling:touch]"
            style={{ backgroundColor: 'var(--color-bg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-3 top-3 sm:right-4 sm:top-4 z-10 p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Fechar modal"
            >
              <X size={22} style={{ color: 'var(--color-text-primary)' }} />
            </button>

            {modalType === 'login' ? <LoginForm /> : <SignupForm />}
          </div>
        </div>
      )}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
}
