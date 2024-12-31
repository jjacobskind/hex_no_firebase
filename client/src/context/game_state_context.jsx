import React, { createContext, useEffect, useState } from 'react';
import { useSocket } from '../hooks/use_socket';
import { getGameState, setGameState } from '../services/game_service';
import {
  generateHexBoard,
  generateEdges,
  generateVertices
} from '../utils/board_utils';

export const GameStateContext = createContext(null);

// Minimal dev card deck. (From Phase 10)
const BASE_DECK = [
  'Knight',
  'Knight',
  'RoadBuilding',
  'YearOfPlenty',
  'Monopoly',
  'VictoryPoint',
];
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
const INITIAL_DEV_DECK = shuffleArray([...BASE_DECK, ...BASE_DECK, ...BASE_DECK.slice(0, 3)]);

export function GameStateProvider({ children }) {
  const [players, setPlayers] = useState([]);
  const [tiles, setTiles] = useState([]);
  const [edges, setEdges] = useState([]);
  const [vertices, setVertices] = useState([]);
  const [roads, setRoads] = useState([]);
  const [settlements, setSettlements] = useState([]);

  // Minimal resource tracking
  const [playerResources, setPlayerResources] = useState({});

  const [selectedTile, setSelectedTile] = useState(null);

  // Build modes
  const [isBuildingRoad, setIsBuildingRoad] = useState(false);
  const [isBuildingSettlement, setIsBuildingSettlement] = useState(false);

  // Robber
  const [isMovingRobber, setIsMovingRobber] = useState(false);
  const [robberTileId, setRobberTileId] = useState(null);
  const [playersToStealFrom, setPlayersToStealFrom] = useState([]);

  // Dice
  const [diceResult, setDiceResult] = useState(null);

  // Dev cards
  const [devDeck, setDevDeck] = useState([...INITIAL_DEV_DECK]);
  const [playerDevCards, setPlayerDevCards] = useState({});

  // Phase 11: Trading
  // We'll store a single "pendingTrade" at a time for demonstration
  // e.g. { from, to, offer, request, status: 'pending' | 'accepted' | 'rejected' }
  const [pendingTrade, setPendingTrade] = useState(null);

  const socket = useSocket();

  // Helper: current username from AuthContext, if available
  function currentUserName() {
    // We'll override this with real auth logic if desired
    return 'DefaultPlayer';
  }

  useEffect(() => {
    const existingGameState = getGameState();
    if (!existingGameState.tiles) {
      const newTiles = generateHexBoard();
      const newEdges = generateEdges(newTiles);
      const newVertices = generateVertices(newTiles);

      setGameState({
        tiles: newTiles,
        edges: newEdges,
        vertices: newVertices,
        roads: [],
        settlements: [],
        robberTileId: null,
        playerResources: {},
        devDeck: devDeck,
        playerDevCards: {},
        pendingTrade: null
      });

      setTiles(newTiles);
      setEdges(newEdges);
      setVertices(newVertices);
      setRobberTileId(null);
    } else {
      setTiles(existingGameState.tiles);
      setEdges(existingGameState.edges || []);
      setVertices(existingGameState.vertices || []);
      setRoads(existingGameState.roads || []);
      setSettlements(existingGameState.settlements || []);
      setRobberTileId(existingGameState.robberTileId || null);
      setPlayerResources(existingGameState.playerResources || {});
      setDevDeck(existingGameState.devDeck || devDeck);
      setPlayerDevCards(existingGameState.playerDevCards || {});
      setPendingTrade(existingGameState.pendingTrade || null);
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.emit('join-game', { playerName: 'DefaultPlayer' });

    const handlePlayersUpdate = (updatedPlayers) => {
      setPlayers(updatedPlayers);
      setGameState({ players: updatedPlayers });
    };

    socket.on('players-updated', handlePlayersUpdate);

    return () => {
      socket.off('players-updated', handlePlayersUpdate);
    };
  }, [socket]);

  // Periodic sync
  useEffect(() => {
    const gs = getGameState();
    if (gs.players && gs.players !== players) setPlayers(gs.players);
    if (gs.tiles && gs.tiles !== tiles) setTiles(gs.tiles);
    if (gs.edges && gs.edges !== edges) setEdges(gs.edges);
    if (gs.vertices && gs.vertices !== vertices) setVertices(gs.vertices);
    if (gs.roads && gs.roads !== roads) setRoads(gs.roads);
    if (gs.settlements && gs.settlements !== settlements) setSettlements(gs.settlements);
    if (gs.robberTileId !== undefined && gs.robberTileId !== robberTileId) {
      setRobberTileId(gs.robberTileId);
    }
    if (gs.playerResources && gs.playerResources !== playerResources) {
      setPlayerResources(gs.playerResources);
    }
    if (gs.devDeck && gs.devDeck !== devDeck) {
      setDevDeck(gs.devDeck);
    }
    if (gs.playerDevCards && gs.playerDevCards !== playerDevCards) {
      setPlayerDevCards(gs.playerDevCards);
    }
    if (gs.pendingTrade && gs.pendingTrade !== pendingTrade) {
      setPendingTrade(gs.pendingTrade);
    }
  }, [
    players, tiles, edges, vertices, roads, settlements,
    robberTileId, playerResources, devDeck, playerDevCards, pendingTrade
  ]);

  /** Basic build logic omitted for brevity—same from previous phases **/

  // ... (buildRoad, buildSettlement, moveRobber, stealFromPlayer, rollDice, distributeResources, etc.) ...

  // For brevity, let's keep those the same as Phase 10. If you need them here, just copy them in.

  // -------------------------------------------------------
  // Phase 11: Trading
  // -------------------------------------------------------
  function proposeTrade(from, to, offer, request) {
    const newTrade = {
      from,
      to,
      offer,
      request,
      status: 'pending'
    };
    setPendingTrade(newTrade);
    setGameState({ pendingTrade: newTrade });
    console.log(`${from} proposes trade with ${to}: Offer=${offer}, Request=${request}`);
  }

  function acceptTrade() {
    if (!pendingTrade || pendingTrade.status !== 'pending') return;
    // Ensure both players have enough resources
    const newResources = { ...playerResources };
    const fromRes = newResources[pendingTrade.from] || 0;
    const toRes = newResources[pendingTrade.to] || 0;

    if (fromRes < pendingTrade.offer) {
      console.log(`Trade failed: ${pendingTrade.from} doesn't have enough resources!`);
      // We could forcibly reject or just set status to "failed."
      const rejectedTrade = { ...pendingTrade, status: 'rejected' };
      setPendingTrade(rejectedTrade);
      setGameState({ pendingTrade: rejectedTrade });
      return;
    }
    if (toRes < pendingTrade.request) {
      console.log(`Trade failed: ${pendingTrade.to} doesn't have enough resources!`);
      const rejectedTrade = { ...pendingTrade, status: 'rejected' };
      setPendingTrade(rejectedTrade);
      setGameState({ pendingTrade: rejectedTrade });
      return;
    }

    // Exchange resources
    newResources[pendingTrade.from] = fromRes - pendingTrade.offer + pendingTrade.request;
    newResources[pendingTrade.to] = toRes - pendingTrade.request + pendingTrade.offer;

    setPlayerResources(newResources);
    setGameState({ playerResources: newResources });

    const acceptedTrade = { ...pendingTrade, status: 'accepted' };
    setPendingTrade(acceptedTrade);
    setGameState({ pendingTrade: acceptedTrade });

    console.log(`Trade accepted! ${pendingTrade.from} gave ${pendingTrade.offer} to ${pendingTrade.to}, and got ${pendingTrade.request} in return.`);
  }

  function rejectTrade() {
    if (!pendingTrade || pendingTrade.status !== 'pending') return;
    const rejectedTrade = { ...pendingTrade, status: 'rejected' };
    setPendingTrade(rejectedTrade);
    setGameState({ pendingTrade: rejectedTrade });
    console.log(`Trade rejected by ${pendingTrade.to}.`);
  }

  const contextValue = {
    players,
    tiles,
    edges,
    vertices,
    roads,
    settlements,
    playerResources,
    devDeck,
    playerDevCards,
    selectedTile,
    robberTileId,
    diceResult,

    // Existing build/robber methods from prior phases would appear here...
    // buildRoad, buildSettlement, moveRobber, stealFromPlayer, etc.
    // rollDice, distributeResources, etc.

    // Trading
    pendingTrade,
    proposeTrade,
    acceptTrade,
    rejectTrade,

    // Auth
    currentUserName: currentUserName(),

    // For toggling modes, etc.
    isBuildingRoad,
    setIsBuildingRoad,
    isBuildingSettlement,
    setIsBuildingSettlement,
    isMovingRobber,
    setIsMovingRobber,
    playersToStealFrom
  };

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
}
