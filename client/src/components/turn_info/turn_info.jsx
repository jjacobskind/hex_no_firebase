import React from 'react';
import { useGameState } from '../../hooks/use_game_state';
import './turn_info.css';

/**
 * TurnInfo:
 * - Shows which player's turn it is
 * - "End Turn" button increments currentPlayerIndex
 * - If someone has 10+ victory points, show a winner message
 */
export default function TurnInfo() {
  const {
    players,
    currentPlayerIndex,
    endTurn,
    winner
  } = useGameState();

  if (winner) {
    return (
      <div className="turn-info">
        <h3>Winner!</h3>
        <p>Congratulations, {winner}!</p>
      </div>
    );
  }

  if (!players || players.length === 0) {
    return (
      <div className="turn-info">
        <h3>No players yet</h3>
      </div>
    );
  }

  const currentPlayer = players[currentPlayerIndex] || '???';

  return (
    <div className="turn-info">
      <h3>Turn Info</h3>
      <p>Current Player: <strong>{currentPlayer}</strong></p>
      <button onClick={endTurn}>End Turn</button>
    </div>
  );
}
