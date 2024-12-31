import React, { useEffect } from 'react';
import { useGameState } from '../../hooks/use_game_state';
import BoardScene from '../board_scene/board_scene';
import './game_page.css';

export default function GamePage() {
  const { players } = useGameState();

  // Log whenever players change
  useEffect(() => {
    console.log('[GamePage] players updated:', players);
  }, [players]);

  return (
    <div className="game-page">
      <h2>Hex Island</h2>
      <p>This 3D board is now rendered via react-three-fiber:</p>

      {/* Our new 3D board */}
      <BoardScene />

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
