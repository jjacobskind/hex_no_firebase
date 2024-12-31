import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import MainRouter from './main_router';

import { AuthProvider } from './context/auth_context';
// In Phase 2, we'll add { GameStateProvider } for the game state.

import './styles/global.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}
