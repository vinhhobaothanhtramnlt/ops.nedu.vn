import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@modules/auth/stores/useAuthStore'

export const ProtectedRoute: React.FC = () => {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
