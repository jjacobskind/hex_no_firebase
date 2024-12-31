/**
 * This file replicates some logic from the old Angular gameService.
 * We'll store "global" game data and provide functions to mutate it.
 *
 * In Phase 2, we're just a placeholder. We'll expand in later phases
 * to handle dice rolls, building, robber, trades, etc.
 */

const gameState = {
  players: [],
  // e.g., tiles: [], devCards: [], etc. (later)
};

/**
 * Retrieve the entire game state object.
 */
export function getGameState() {
  return gameState;
}

/**
 * Set or merge new properties into the game state.
 * Usage example: setGameState({ players: [...] });
 */
export function setGameState(newState) {
  Object.assign(gameState, newState);
}
