import React, { useState } from 'react';
import { useGameState } from '../../hooks/use_game_state';
import './robber_control.css';

/**
 * RobberControl:
 * - A button to toggle "Move Robber" mode
 * - If robber is placed, we show which tile it is on.
 * - If just placed, pick a neighbor player to steal from (placeholder).
 */
export default function RobberControl() {
  const {
    isMovingRobber,
    setIsMovingRobber,
    robberTileId,
    playersToStealFrom,
    stealFromPlayer
  } = useGameState();

  const [chosenPlayer, setChosenPlayer] = useState('');

  const toggleMoveRobber = () => {
    setIsMovingRobber(!isMovingRobber);
  };

  const handleSteal = () => {
    if (!chosenPlayer) return;
    stealFromPlayer(chosenPlayer);
    setChosenPlayer('');
  };

  return (
    <div className="robber-control">
      <h3>Robber Control</h3>
      <button
        className={isMovingRobber ? 'active' : ''}
        onClick={toggleMoveRobber}
      >
        {isMovingRobber ? 'Cancel Robber Move' : 'Move Robber'}
      </button>

      {robberTileId && (
        <div className="robber-info">
          <p>Robber is on tile: <strong>{robberTileId}</strong></p>
        </div>
      )}

      {playersToStealFrom.length > 0 && (
        <div className="robber-steal">
          <p>Pick a player to steal from:</p>
          <select
            value={chosenPlayer}
            onChange={(e) => setChosenPlayer(e.target.value)}
          >
            <option value="">-- choose --</option>
            {playersToStealFrom.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button onClick={handleSteal} disabled={!chosenPlayer}>
            Steal
          </button>
        </div>
      )}
    </div>
  );
}
