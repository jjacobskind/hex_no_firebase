import React, { createContext, useEffect, useState } from 'react';
import { useSocket } from '../hooks/use_socket';
import { getGameState, setGameState } from '../services/game_service';
import {
  generateHexBoard,
  generateEdges,
  generateVertices
} from '../utils/board_utils';

export const GameStateContext = createContext(null);

// Minimal dev card deck. (From Phase 10 - 11)
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

  // NEW for Phase 12: track victory points separately or reuse "resources" for simplicity
  // We'll do a separate map: { [playerName]: numberOfVictoryPoints }
  const [playerVictoryPoints, setPlayerVictoryPoints] = useState({});

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

  // Trading (Phase 11)
  const [pendingTrade, setPendingTrade] = useState(null);

  // Phase 12: Turn flow
  // We'll keep a simple "current player index," starting at 0
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  // If someone hits 10 points, we store them in "winner"
  const [winner, setWinner] = useState(null);

  const socket = useSocket();

  // Helper: current username from AuthContext, if available
  function currentUserName() {
    // We'll override this with real auth if you prefer
    return 'DefaultPlayer';
  }

  // On mount: if we have no tiles, generate them
  useEffect(() => {
    const existingGameState = getGameState();
    if (!existingGameState.tiles) {
      const newTiles = generateHexBoard();
      const newEdges = generateEdges(newTiles);
      const newVertices = generateVertices(newTiles);

      // We can pick up to 4 random players for demonstration, or empty
      // For real usage, you'd set players from the login / server handshake
      const defaultPlayers = ['Alice', 'Bob'];

      setGameState({
        players: defaultPlayers,
        tiles: newTiles,
        edges: newEdges,
        vertices: newVertices,
        roads: [],
        settlements: [],
        robberTileId: null,
        playerResources: {},
        playerVictoryPoints: {},
        devDeck: devDeck,
        playerDevCards: {},
        pendingTrade: null,
        currentPlayerIndex: 0,
        winner: null
      });

      setPlayers(defaultPlayers);
      setTiles(newTiles);
      setEdges(newEdges);
      setVertices(newVertices);
      setRobberTileId(null);
    } else {
      // Hydrate from existing
      setPlayers(existingGameState.players || []);
      setTiles(existingGameState.tiles || []);
      setEdges(existingGameState.edges || []);
      setVertices(existingGameState.vertices || []);
      setRoads(existingGameState.roads || []);
      setSettlements(existingGameState.settlements || []);
      setRobberTileId(existingGameState.robberTileId || null);
      setPlayerResources(existingGameState.playerResources || {});
      setPlayerVictoryPoints(existingGameState.playerVictoryPoints || {});
      setDevDeck(existingGameState.devDeck || devDeck);
      setPlayerDevCards(existingGameState.playerDevCards || {});
      setPendingTrade(existingGameState.pendingTrade || null);
      setCurrentPlayerIndex(
        existingGameState.currentPlayerIndex !== undefined
          ? existingGameState.currentPlayerIndex
          : 0
      );
      setWinner(existingGameState.winner || null);
    }
  }, []);

  // Socket & sync logic omitted for brevity—similar to previous phases
  // ...

  // ------------------------------------------------------------------
  // BUILD LOGIC (same as prior phases) - omitted for brevity or re-add
  // ------------------------------------------------------------------

  // For illustration, here's how we add points when a settlement is built:
  function buildSettlement(vertexId, owner) {
    const existing = settlements.find((s) => s.vertexId === vertexId);
    if (existing) {
      console.log('Vertex already has a settlement!');
      return;
    }
    const newSet = { vertexId, owner };
    const updatedSetts = [...settlements, newSet];
    setSettlements(updatedSetts);

    // awarding 1 victory point for a new settlement (for demonstration)
    const newVP = { ...playerVictoryPoints };
    newVP[owner] = (newVP[owner] || 0) + 1;

    // check if that triggered a win
    let newWinner = winner;
    if (newVP[owner] >= 10) {
      newWinner = owner;
      console.log(`${owner} has reached 10 points and wins!`);
    }

    // set state
    setPlayerVictoryPoints(newVP);
    setGameState({
      settlements: updatedSetts,
      playerVictoryPoints: newVP,
      winner: newWinner
    });
    if (newWinner) {
      setWinner(newWinner);
    }

    console.log(`Settlement built by ${owner} on vertex ${vertexId}, now has ${newVP[owner]} VP`);
  }

  // Similarly, if we want to add points for a dev card:
  function playDevCard(username, cardName) {
    // Remove card from player's hand
    const playerHand = (playerDevCards[username] || []).slice();
    const cardIndex = playerHand.indexOf(cardName);
    if (cardIndex === -1) {
      console.log('Card not found in hand!');
      return;
    }
    playerHand.splice(cardIndex, 1);

    switch (cardName) {
      case 'Knight':
        console.log(`${username} plays Knight -> must move robber`);
        setIsMovingRobber(true);
        break;
      case 'RoadBuilding':
        console.log(`${username} plays Road Building -> 2 free roads (not auto-placed).`);
        break;
      case 'YearOfPlenty':
        console.log(`${username} plays Year of Plenty -> +2 resources`);
        giveResources(username, 2);
        break;
      case 'Monopoly':
        console.log(`${username} plays Monopoly -> steal 2 from each other player`);
        doMonopoly(username, 2);
        break;
      case 'VictoryPoint':
        console.log(`${username} plays a Victory Point -> +1 VP`);
        awardVictoryPoint(username);
        break;
      default:
        console.log(`${username} plays an unknown card: ${cardName}`);
        break;
    }

    // finalize
    const newDevCards = { ...playerDevCards };
    newDevCards[username] = playerHand;
    setPlayerDevCards(newDevCards);
    setGameState({ playerDevCards: newDevCards });
  }

  function awardVictoryPoint(player) {
    const newVP = { ...playerVictoryPoints };
    newVP[player] = (newVP[player] || 0) + 1;
    let newWinner = winner;
    if (newVP[player] >= 10) {
      newWinner = player;
      console.log(`${player} has reached 10 points and wins!`);
    }
    setPlayerVictoryPoints(newVP);
    setGameState({ playerVictoryPoints: newVP, winner: newWinner });
    if (newWinner) {
      setWinner(newWinner);
    }
  }

  // endTurn: move to next player, if no winner
  function endTurn() {
    if (winner) {
      console.log(`Game over, ${winner} already won!`);
      return;
    }
    const nextIndex = (currentPlayerIndex + 1) % players.length;
    setCurrentPlayerIndex(nextIndex);
    setGameState({ currentPlayerIndex: nextIndex });
    console.log(`Turn ended. Next player: ${players[nextIndex]}`);
  }

  // Utility for dev cards
  function giveResources(username, amount) {
    const newResources = { ...playerResources };
    newResources[username] = (newResources[username] || 0) + amount;
    setPlayerResources(newResources);
    setGameState({ playerResources: newResources });
  }
  function doMonopoly(username, amount) {
    const newResources = { ...playerResources };
    let stolen = 0;
    players.forEach((p) => {
      if (p === username) return;
      const pRes = newResources[p] || 0;
      if (pRes > 0) {
        const take = Math.min(pRes, amount);
        newResources[p] = pRes - take;
        stolen += take;
      }
    });
    newResources[username] = (newResources[username] || 0) + stolen;
    setPlayerResources(newResources);
    setGameState({ playerResources: newResources });
    console.log(`${username} stole a total of ${stolen} via Monopoly!`);
  }

  const contextValue = {
    players,
    tiles,
    edges,
    vertices,
    roads,
    settlements,
    playerResources,
    playerVictoryPoints,
    devDeck,
    playerDevCards,
    pendingTrade,

    selectedTile,
    setSelectedTile: (tile) => setSelectedTile(tile),
    isBuildingRoad,
    setIsBuildingRoad,
    isBuildingSettlement,
    setIsBuildingSettlement,

    isMovingRobber,
    setIsMovingRobber,
    robberTileId,
    playersToStealFrom,

    diceResult,

    // Turn flow
    currentPlayerIndex,
    endTurn,
    winner,

    // Build
    buildSettlement, // updated to award VPs
    // (buildRoad, moveRobber, etc. could remain as from prior phases)

    // Dev cards
    playDevCard,

    // Utility
    awardVictoryPoint
  };

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
}
