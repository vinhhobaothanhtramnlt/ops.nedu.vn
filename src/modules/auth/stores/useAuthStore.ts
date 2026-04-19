import { create } from 'zustand'
import { supabase } from '@shared/config/supabase'
import { api } from '@shared/config/api-client'
import type { AuthUser } from '@shared/types/auth'

const IS_MOCK = import.meta.env.VITE_ENABLE_MOCKING === 'true'

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  initialize: () => Promise<void>
  loginWithGoogle: () => Promise<void>
  loginDev?: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  initialize: async () => {
    set({ isLoading: true })

    // ── Mock mode: skip Supabase, call /api/auth/me directly ──
    if (IS_MOCK) {
      try {
        const user = await api.get<AuthUser>('/auth/me')
        set({ user: user ?? null, isLoading: false })
      } catch {
        set({ user: null, isLoading: false })
      }
      return
    }

    // ── Production: normal Supabase flow ──
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      try {
        const user = await api.get<AuthUser>('/auth/me')
        set({ user: user ?? null, isLoading: false })
      } catch {
        set({ user: null, isLoading: false })
      }
    } else {
      set({ user: null, isLoading: false })
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        try {
          const user = await api.get<AuthUser>('/auth/me')
          set({ user: user ?? null })
        } catch {
          set({ user: null })
        }
      } else if (event === 'SIGNED_OUT') {
        set({ user: null })
      }
    })
  },

  loginWithGoogle: async () => {
    if (IS_MOCK) {
      // In mock mode just redirect to dashboard — MSW will serve the user
      window.location.href = '/dashboard'
      return
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth-callback` },
    })
  },

  loginDev: async () => {
    // Dev bypass — only available when VITE_ENABLE_MOCKING=true
    try {
      const user = await api.get<AuthUser>('/auth/me')
      set({ user: user ?? null })
      window.location.href = '/dashboard'
    } catch {
      console.error('[dev login] /api/auth/me failed')
    }
  },

  logout: async () => {
    if (!IS_MOCK) {
      await supabase.auth.signOut()
    }
    set({ user: null })
  },
}))
