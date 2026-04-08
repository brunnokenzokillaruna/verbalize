'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
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

  return (
    <AuthModalContext.Provider value={{ modalType, openModal, closeModal }}>
      {children}
      
      {modalType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative flex w-full max-w-lg flex-col items-center justify-center p-6 lg:p-12 animate-scale-in bg-white dark:bg-neutral-900 rounded-3xl"
              style={{ backgroundColor: 'var(--color-bg)' }}>
                
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Close modal"
            >
              <X size={24} style={{ color: 'var(--color-text-primary)' }} />
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
