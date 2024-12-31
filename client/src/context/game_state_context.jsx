// src/context/game_state_context.jsx

import React, { createContext, useState, useEffect } from 'react';
import { initSocket } from '../services/socket_service';

// Create the context
export const GameStateContext = createContext(null);

// Provide a default initial shape that matches your mock server
const defaultGameState = {
  players: [],
  tiles: [],
  edges: [],
  vertices: [],
  roads: [],
  settlements: [],
  playerResources: {},
  playerVictoryPoints: {},
  currentPlayerIndex: 0,
  winner: null,
  robberTileId: null,
  diceResult: null,
  devDeck: [],
  playerDevCards: {},
  pendingTrade: null,
  longestRoadOwner: null,
  longestRoadLength: 0,
  largestArmyOwner: null,
  largestArmySize: 0,
  playerKnightsPlayed: {},
  // The missing piece:
  playersToStealFrom: [] // ensure this is ALWAYS an array
};

export function GameStateProvider({ children }) {
  // We'll map each key to a piece of React state:
  const [players, setPlayers] = useState(defaultGameState.players);
  const [tiles, setTiles] = useState(defaultGameState.tiles);
  const [edges, setEdges] = useState(defaultGameState.edges);
  const [vertices, setVertices] = useState(defaultGameState.vertices);
  const [roads, setRoads] = useState(defaultGameState.roads);
  const [settlements, setSettlements] = useState(defaultGameState.settlements);
  const [playerResources, setPlayerResources] = useState(defaultGameState.playerResources);
  const [playerVictoryPoints, setPlayerVictoryPoints] = useState(defaultGameState.playerVictoryPoints);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(defaultGameState.currentPlayerIndex);
  const [winner, setWinner] = useState(defaultGameState.winner);
  const [robberTileId, setRobberTileId] = useState(defaultGameState.robberTileId);
  const [diceResult, setDiceResult] = useState(defaultGameState.diceResult);
  const [devDeck, setDevDeck] = useState(defaultGameState.devDeck);
  const [playerDevCards, setPlayerDevCards] = useState(defaultGameState.playerDevCards);
  const [pendingTrade, setPendingTrade] = useState(defaultGameState.pendingTrade);
  const [longestRoadOwner, setLongestRoadOwner] = useState(defaultGameState.longestRoadOwner);
  const [longestRoadLength, setLongestRoadLength] = useState(defaultGameState.longestRoadLength);
  const [largestArmyOwner, setLargestArmyOwner] = useState(defaultGameState.largestArmyOwner);
  const [largestArmySize, setLargestArmySize] = useState(defaultGameState.largestArmySize);
  const [playerKnightsPlayed, setPlayerKnightsPlayed] = useState(defaultGameState.playerKnightsPlayed);
  // The missing array:
  const [playersToStealFrom, setPlayersToStealFrom] = useState(defaultGameState.playersToStealFrom);

  // Optional: Initialize the socket once
  useEffect(() => {
    const socket = initSocket('http://localhost:4000'); 
    // or your server endpoint

    // Example listener that merges server updates
    socket.on('game-state-updated', (newState) => {
      console.log('[Client] Received updated game state:', newState);

      // Merge or replace your local pieces with newState:
      if (newState.players) setPlayers(newState.players);
      if (newState.tiles) setTiles(newState.tiles);
      if (newState.edges) setEdges(newState.edges);
      if (newState.vertices) setVertices(newState.vertices);
      if (newState.roads) setRoads(newState.roads);
      if (newState.settlements) setSettlements(newState.settlements);
      if (newState.playerResources) setPlayerResources(newState.playerResources);
      if (newState.playerVictoryPoints) setPlayerVictoryPoints(newState.playerVictoryPoints);
      if (newState.currentPlayerIndex !== undefined) setCurrentPlayerIndex(newState.currentPlayerIndex);
      if (newState.winner !== undefined) setWinner(newState.winner);
      if (newState.robberTileId !== undefined) setRobberTileId(newState.robberTileId);
      if (newState.diceResult !== undefined) setDiceResult(newState.diceResult);
      if (newState.devDeck) setDevDeck(newState.devDeck);
      if (newState.playerDevCards) setPlayerDevCards(newState.playerDevCards);
      if (newState.pendingTrade !== undefined) setPendingTrade(newState.pendingTrade);
      if (newState.longestRoadOwner !== undefined) setLongestRoadOwner(newState.longestRoadOwner);
      if (newState.longestRoadLength !== undefined) setLongestRoadLength(newState.longestRoadLength);
      if (newState.largestArmyOwner !== undefined) setLargestArmyOwner(newState.largestArmyOwner);
      if (newState.largestArmySize !== undefined) setLargestArmySize(newState.largestArmySize);
      if (newState.playerKnightsPlayed) setPlayerKnightsPlayed(newState.playerKnightsPlayed);
      // The important line: handle playersToStealFrom
      if (newState.playersToStealFrom) setPlayersToStealFrom(newState.playersToStealFrom);
    });

    // Cleanup on unmount
    return () => {
      socket.off('game-state-updated');
      socket.disconnect();
    };
  }, []);

  // Return these states & updaters so components can read them
  return (
    <GameStateContext.Provider
      value={{
        players, setPlayers,
        tiles, setTiles,
        edges, setEdges,
        vertices, setVertices,
        roads, setRoads,
        settlements, setSettlements,
        playerResources, setPlayerResources,
        playerVictoryPoints, setPlayerVictoryPoints,
        currentPlayerIndex, setCurrentPlayerIndex,
        winner, setWinner,
        robberTileId, setRobberTileId,
        diceResult, setDiceResult,
        devDeck, setDevDeck,
        playerDevCards, setPlayerDevCards,
        pendingTrade, setPendingTrade,
        longestRoadOwner, setLongestRoadOwner,
        longestRoadLength, setLongestRoadLength,
        largestArmyOwner, setLargestArmyOwner,
        largestArmySize, setLargestArmySize,
        playerKnightsPlayed, setPlayerKnightsPlayed,
        playersToStealFrom, setPlayersToStealFrom,
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
}