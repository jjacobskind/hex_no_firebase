import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './components/login_page/login_page';
import GamePage from './components/game_page/game_page';
import { useAuth } from './hooks/use_auth';

export default function MainRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/game" element={
        <RequireAuth>
          <GamePage />
        </RequireAuth>
      }/>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

// This ensures /game is only accessible if logged in
function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
