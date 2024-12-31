import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import MainRouter from './main_router';

import { AuthProvider } from './context/auth_context';
import { GameStateProvider } from './context/game_state_context'; 
// We add GameStateProvider in Phase 2

import './styles/global.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GameStateProvider>
          <MainRouter />
        </GameStateProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
