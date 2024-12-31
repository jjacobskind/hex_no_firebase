import { useContext } from 'react';
import { GameStateContext } from '../context/game_state_context';

/**
 * A custom hook to get or set game state from anywhere in the app.
 */
export function useGameState() {
  return useContext(GameStateContext);
}
