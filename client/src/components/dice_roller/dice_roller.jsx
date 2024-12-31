import React, { useEffect } from 'react';
import { useGameState } from '../../hooks/use_game_state';
import { useAuth } from '../../hooks/use_auth';
import './dice_roller.css';

/**
 * DiceRoller:
 * - Shows current dice result
 * - "Roll Dice" button triggers gameState.rollDice()
 * - If 7, robber mode is forced
 */
export default function DiceRoller() {
  const { diceResult, rollDice } = useGameState();
  const { user } = useAuth();

  const handleRoll = () => {
    if (!user) {
      alert('You must be logged in to roll dice!');
      return;
    }
    rollDice(user.username);
  };

  return (
    <div className="dice-roller">
      <h3>Dice Roller</h3>
      <p>Current Dice: <strong>{diceResult || '-'}</strong></p>
      <button onClick={handleRoll}>Roll Dice</button>
    </div>
  );
}
