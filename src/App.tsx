import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { AppProvider } from './contexts/AppContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Events } from './pages/Events'
import { EventDetail } from './pages/EventDetail'
import { Guests } from './pages/Guests'
import { GuestDetail } from './pages/GuestDetail'
import { CardBuilder } from './pages/CardBuilder'
import { Invitations } from './pages/Invitations'
import { Analytics } from './pages/Analytics'
import { Settings } from './pages/Settings'
import EventConfigurations from './pages/EventConfigurations'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/events" element={
                <ProtectedRoute>
                  <Layout>
                    <Events />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/events/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <EventDetail />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/guests" element={
                <ProtectedRoute>
                  <Layout>
                    <Guests />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/guests/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <GuestDetail />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/card-builder" element={
                <ProtectedRoute>
                  <Layout>
                    <CardBuilder />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/invitations" element={
                <ProtectedRoute>
                  <Layout>
                    <Invitations />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <Layout>
                    <Analytics />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/events/:id/analytics" element={
                <ProtectedRoute>
                  <Layout>
                    <Analytics />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/events/:id/configurations" element={
                <ProtectedRoute>
                  <Layout>
                    <EventConfigurations />
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App