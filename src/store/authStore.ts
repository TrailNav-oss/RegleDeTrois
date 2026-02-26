import { create } from 'zustand';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  initAuth: () => () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  loading: false,
  error: null,
  initialized: false,

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
      set({ loading: false });
    } catch (err: any) {
      set({ loading: false, error: getFirebaseErrorMessage(err.code) });
    }
  },

  signUp: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      set({ loading: false });
    } catch (err: any) {
      set({ loading: false, error: getFirebaseErrorMessage(err.code) });
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      await signOut(auth);
      set({ loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.message });
    }
  },

  clearError: () => set({ error: null }),

  initAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      set({ user, initialized: true });
    });
    return unsubscribe;
  },
}));

import i18n from '../i18n';

function getFirebaseErrorMessage(code: string): string {
  const t = (key: string) => i18n.t(key);
  switch (code) {
    case 'auth/invalid-email':
      return t('auth.invalidEmail');
    case 'auth/user-disabled':
      return t('auth.userDisabled');
    case 'auth/user-not-found':
      return t('auth.userNotFound');
    case 'auth/wrong-password':
      return t('auth.wrongPassword');
    case 'auth/email-already-in-use':
      return t('auth.emailInUse');
    case 'auth/weak-password':
      return t('auth.weakPassword');
    case 'auth/too-many-requests':
      return t('auth.tooManyRequests');
    default:
      return t('auth.genericError');
  }
}
