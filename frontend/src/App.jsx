import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import GuestRoute from './components/GuestRoute'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import VehiclePage from './pages/VehiclePage'
import DriverPage from './pages/DriverPage'
import TripPage from './pages/TripPage'
import MaintenancePage from './pages/MaintenancePage'
import FuelExpensePage from './pages/FuelExpensePage'
import AnalyticsPage from './pages/AnalyticsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/fleet" element={<VehiclePage />} />
              <Route path="/drivers" element={<DriverPage />} />
              <Route path="/trips" element={<TripPage />} />
              <Route path="/maintenance" element={<MaintenancePage />} />
              <Route path="/fuel-expenses" element={<FuelExpensePage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
