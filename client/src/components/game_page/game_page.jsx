import React, { useEffect } from 'react';
import { useGameState } from '../../hooks/use_game_state';
import './game_page.css';

/**
 * Phase 2: We show how to read from the game context
 * and how to handle real-time changes (the players array).
 */
export default function GamePage() {
  const { players } = useGameState();

  // Example: log whenever players change
  useEffect(() => {
    console.log('[GamePage] players updated:', players);
  }, [players]);

  return (
    <div className="game-page">
      <h2>Welcome to Hex Island!</h2>
      <p>Real-time data will appear here as we expand.</p>

      <div style={{ marginTop: 20 }}>
        <h3>Players in the game:</h3>
        <ul>
          {players.map((p, idx) => (
            <li key={idx}>{p}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
