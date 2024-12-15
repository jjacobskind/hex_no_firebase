// src/App.jsx (adjusted to include Toast)
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/auth_context'
import { ToastProvider } from './context/toast_context'
import { GameProvider } from './context/game_context'
import LandingPage from './pages/landing_page'
import LoginPage from './pages/login_page'
import RegisterPage from './pages/register_page'
import GamePage from './pages/game_page'
import Toast from './components/toast'

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <GameProvider>
          <Router>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/game" element={<GamePage />} />
            </Routes>
            <Toast />
          </Router>
        </GameProvider>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App