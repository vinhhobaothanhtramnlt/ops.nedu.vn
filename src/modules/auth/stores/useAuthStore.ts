import { create } from 'zustand'
import { supabase } from '@shared/config/supabase'
import { api } from '@shared/config/api-client'
import type { AuthUser } from '@shared/types/auth'

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  initialize: () => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  initialize: async () => {
    set({ isLoading: true })
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
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth-callback` },
    })
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
}))
