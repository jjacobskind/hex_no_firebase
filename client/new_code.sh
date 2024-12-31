#!/usr/bin/env bash

#############################################
# PHASE 15 UPDATE SCRIPT
# Hooks the client to a real backend via Socket.io
#############################################

# 1) Update socket_service.js to define new client->server events
cat << 'EOF' > src/services/socket_service.js
import { io } from 'socket.io-client';

let socket = null;

export function initSocket(url = 'http://localhost:4000') {
  if (!socket) {
    socket = io(url);

    // Example event handlers
    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    // Listen for a "game-state-updated" event from server
    socket.on('game-state-updated', (newState) => {
      // We'll have the client sync local state with newState
      console.log('[Socket] Received updated game state from server:', newState);
      // We'll let GameStateContext handle merging
      if (typeof window !== 'undefined' && window.handleServerGameState) {
        window.handleServerGameState(newState);
      }
    });
  }
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
EOF

# 2) Overwrite or update GameStateContext to rely on server calls
cat << 'EOF' > src/context/game_state_context.jsx
import React, { createContext, useEffect, useState } from 'react';
import { initSocket, getSocket } from '../services/socket_service';
import { getGameState, setGameState } from '../services/game_service';
import { generateHexBoard, generateEdges, generateVertices } from '../utils/board_utils';

export const GameStateContext = createContext(null);

/**
 * In a real environment, we store minimal local state, letting
 * the server remain the authority. We'll still keep references,
 * but major actions call the server.
 */
export function GameStateProvider({ children }) {
  const [players, setPlayers] = useState([]);
  const [tiles, setTiles] = useState([]);
  const [edges, setEdges] = useState([]);
  const [vertices, setVertices] = useState([]);
  const [roads, setRoads] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [playerResources, setPlayerResources] = useState({});
  const [playerVictoryPoints, setPlayerVictoryPoints] = useState({});
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [winner, setWinner] = useState(null);

  // Additional states from prior phases
  const [isBuildingRoad, setIsBuildingRoad] = useState(false);
  const [isBuildingSettlement, setIsBuildingSettlement] = useState(false);
  const [isMovingRobber, setIsMovingRobber] = useState(false);
  const [robberTileId, setRobberTileId] = useState(null);
  const [diceResult, setDiceResult] = useState(null);
  const [devDeck, setDevDeck] = useState([]);
  const [playerDevCards, setPlayerDevCards] = useState({});
  const [pendingTrade, setPendingTrade] = useState(null);
  const [longestRoadOwner, setLongestRoadOwner] = useState(null);
  const [longestRoadLength, setLongestRoadLength] = useState(0);
  const [largestArmyOwner, setLargestArmyOwner] = useState(null);
  const [largestArmySize, setLargestArmySize] = useState(0);
  const [playerKnightsPlayed, setPlayerKnightsPlayed] = useState({});

  // We'll hold a reference to the socket
  const [socket, setLocalSocket] = useState(null);

  // On mount, initialize the socket & define a global handler for game-state merges
  useEffect(() => {
    const s = initSocket(); // default to http://localhost:4000
    setLocalSocket(s);

    // Provide a global function so socket_service can call back
    if (typeof window !== 'undefined') {
      window.handleServerGameState = handleServerGameState;
    }

    // On unmount, remove the global
    return () => {
      if (typeof window !== 'undefined') {
        delete window.handleServerGameState;
      }
    };
  }, []);

  // handleServerGameState merges the new server state into our local state
  function handleServerGameState(newState) {
    // For simplicity, we replace or merge all fields
    // In a real game, you'd carefully merge to avoid flickers
    setPlayers(newState.players || []);
    setTiles(newState.tiles || []);
    setEdges(newState.edges || []);
    setVertices(newState.vertices || []);
    setRoads(newState.roads || []);
    setSettlements(newState.settlements || []);
    setPlayerResources(newState.playerResources || {});
    setPlayerVictoryPoints(newState.playerVictoryPoints || {});
    setCurrentPlayerIndex(newState.currentPlayerIndex || 0);
    setWinner(newState.winner || null);

    setIsBuildingRoad(false);
    setIsBuildingSettlement(false);
    setIsMovingRobber(false);
    setRobberTileId(newState.robberTileId || null);
    setDiceResult(newState.diceResult || null);
    setDevDeck(newState.devDeck || []);
    setPlayerDevCards(newState.playerDevCards || {});
    setPendingTrade(newState.pendingTrade || null);
    setLongestRoadOwner(newState.longestRoadOwner || null);
    setLongestRoadLength(newState.longestRoadLength || 0);
    setLargestArmyOwner(newState.largestArmyOwner || null);
    setLargestArmySize(newState.largestArmySize || 0);
    setPlayerKnightsPlayed(newState.playerKnightsPlayed || {});
  }

  // -----------------------------------------------------
  // Example: Build Road -> Emit event to server
  // -----------------------------------------------------
  function buildRoad(edgeId, owner) {
    if (!socket) return;
    console.log(`Emitting "build-road" event to server: ${edgeId}, owner=${owner}`);
    socket.emit('build-road', { edgeId, owner });
    // The server will validate & broadcast "game-state-updated"
  }

  // Similarly, build settlement
  function buildSettlement(vertexId, owner) {
    if (!socket) return;
    console.log(`Emitting "build-settlement" event: ${vertexId}, owner=${owner}`);
    socket.emit('build-settlement', { vertexId, owner });
  }

  // End turn
  function endTurn() {
    if (!socket) return;
    console.log('Emitting "end-turn"');
    socket.emit('end-turn');
  }

  // Roll dice
  function rollDice(playerName) {
    if (!socket) return;
    console.log(`${playerName} is rolling dice, emit to server...`);
    socket.emit('roll-dice', { playerName });
  }

  // etc. for dev cards, robber, trading, etc.

  const contextValue = {
    // Basic state
    players,
    tiles,
    edges,
    vertices,
    roads,
    settlements,
    playerResources,
    playerVictoryPoints,
    currentPlayerIndex,
    winner,

    // Titles
    longestRoadOwner,
    longestRoadLength,
    largestArmyOwner,
    largestArmySize,
    playerKnightsPlayed,

    // UI toggles
    isBuildingRoad, setIsBuildingRoad,
    isBuildingSettlement, setIsBuildingSettlement,
    isMovingRobber, setIsMovingRobber,
    robberTileId,
    diceResult,
    devDeck, playerDevCards,
    pendingTrade,

    // Methods that now rely on server calls
    buildRoad,
    buildSettlement,
    endTurn,
    rollDice,
    // devCard => socket.emit('play-dev-card', {...})

    // In real usage, also: moveRobber, tradeProposals, etc.
  };

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
}
EOF

echo "Phase 15 files created/updated successfully!"
echo "Next steps:"
echo "1) Start your backend server on http://localhost:4000 (or your own URL)."
echo "2) Confirm it handles events like 'build-road', 'end-turn', 'roll-dice', etc. and responds with 'game-state-updated'."
echo "3) Your client now defers critical logic to the server, merging the server’s updated state into local UI."
echo "4) This completes the basic approach to hooking your React client to a real backend!"