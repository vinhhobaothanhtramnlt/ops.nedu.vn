import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ProtectedRoute } from './ProtectedRoute'
import { LoginPage } from '@modules/auth/pages/LoginPage'
import { DashboardPage } from '@modules/ops/components/dashboard/DashboardPage'
import { TopBar } from '@shared/components/TopBar'
import { KpiPanel } from '@modules/ops/components/kpi/KpiPanel'
import { useAuthStore } from '@modules/auth/stores/useAuthStore'
import { queryClient } from '@shared/config/query-client'

const AppLayout: React.FC = () => {
  const [showKpi, setShowKpi] = React.useState(false)

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-900">
      <TopBar onKpiClick={() => setShowKpi(true)} />
      <DashboardPage />
      {showKpi && <KpiPanel onClose={() => setShowKpi(false)} />}
    </div>
  )
}

const AppInit: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { initialize } = useAuthStore()
  useEffect(() => { initialize() }, [initialize])
  return <>{children}</>
}

export const AppRouter: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppInit>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth-callback" element={<Navigate to="/dashboard" replace />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<AppLayout />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppInit>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
