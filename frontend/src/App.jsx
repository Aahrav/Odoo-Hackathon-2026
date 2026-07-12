import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import GuestRoute from './components/GuestRoute'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PlaceholderPage from './pages/PlaceholderPage'

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
              <Route
                path="/fleet"
                element={
                  <PlaceholderPage
                    title="Vehicle Registry"
                    description="Manage fleet vehicles, registration numbers, capacity, and availability status."
                  />
                }
              />
              <Route
                path="/maintenance"
                element={
                  <PlaceholderPage
                    title="Maintenance"
                    description="Track maintenance logs, costs, and vehicle shop status."
                  />
                }
              />
              <Route
                path="/trips"
                element={
                  <PlaceholderPage
                    title="Trip Dispatcher"
                    description="Create, dispatch, and complete trips with vehicle and driver assignment."
                  />
                }
              />
              <Route
                path="/drivers"
                element={
                  <PlaceholderPage
                    title="Drivers & Safety Profiles"
                    description="Manage driver licenses, safety scores, and compliance status."
                  />
                }
              />
              <Route
                path="/compliance"
                element={
                  <PlaceholderPage
                    title="Compliance"
                    description="Monitor license expiry, suspensions, and safety officer workflows."
                  />
                }
              />
              <Route
                path="/fuel-expenses"
                element={
                  <PlaceholderPage
                    title="Fuel & Expense Management"
                    description="Log fuel usage, tolls, and operational expenses by vehicle and trip."
                  />
                }
              />
              <Route
                path="/analytics"
                element={
                  <PlaceholderPage
                    title="Reports & Analytics"
                    description="Financial and operational analytics for fleet performance."
                  />
                }
              />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
