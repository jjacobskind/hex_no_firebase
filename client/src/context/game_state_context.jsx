import React, { createContext, useEffect, useState } from 'react';
import { useSocket } from '../hooks/use_socket';
import { getGameState, setGameState } from '../services/game_service';
import {
  generateHexBoard,
  generateEdges,
  generateVertices
} from '../utils/board_utils';

export const GameStateContext = createContext(null);

// Minimal dev card deck. Repeat for bigger deck
const BASE_DECK = [
  'Knight',
  'Knight',
  'RoadBuilding',
  'YearOfPlenty',
  'Monopoly',
  'VictoryPoint',
];

// create a random deck
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// We'll build a deck of 15 cards as an example
const INITIAL_DEV_DECK = shuffleArray([...BASE_DECK, ...BASE_DECK, ...BASE_DECK.slice(0, 3)]);

export function GameStateProvider({ children }) {
  const [players, setPlayers] = useState([]);
  const [tiles, setTiles] = useState([]);
  const [edges, setEdges] = useState([]);
  const [vertices, setVertices] = useState([]);
  const [roads, setRoads] = useState([]);
  const [settlements, setSettlements] = useState([]);

  // Minimal resource tracking: { [username]: numberOfResources }
  const [playerResources, setPlayerResources] = useState({});

  const [selectedTile, setSelectedTile] = useState(null);

  // Build modes
  const [isBuildingRoad, setIsBuildingRoad] = useState(false);
  const [isBuildingSettlement, setIsBuildingSettlement] = useState(false);

  // Robber
  const [isMovingRobber, setIsMovingRobber] = useState(false);
  const [robberTileId, setRobberTileId] = useState(null);
  const [playersToStealFrom, setPlayersToStealFrom] = useState([]);

  // Dice rolling
  const [diceResult, setDiceResult] = useState(null);

  // Dev cards
  const [devDeck, setDevDeck] = useState([...INITIAL_DEV_DECK]);
  // For each user: devCards => array of card names
  const [playerDevCards, setPlayerDevCards] = useState({});

  const socket = useSocket();

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
        playerDevCards: {}
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
  }, [
    players, tiles, edges, vertices, roads, settlements,
    robberTileId, playerResources, devDeck, playerDevCards
  ]);

  /** Place a road on an edge */
  function buildRoad(edgeId, owner) {
    const existing = roads.find(r => r.edgeId === edgeId);
    if (existing) {
      console.log('Edge already has a road!');
      return;
    }
    const newRoad = { edgeId, owner };
    const updatedRoads = [...roads, newRoad];
    setRoads(updatedRoads);
    setGameState({ roads: updatedRoads });
    console.log(`Road built by ${owner} on edge ${edgeId}`);
  }

  /** Place a settlement on a vertex */
  function buildSettlement(vertexId, owner) {
    const existing = settlements.find(s => s.vertexId === vertexId);
    if (existing) {
      console.log('Vertex already has a settlement!');
      return;
    }
    const newSet = { vertexId, owner };
    const updatedSetts = [...settlements, newSet];
    setSettlements(updatedSetts);
    setGameState({ settlements: updatedSetts });
    console.log(`Settlement built by ${owner} on vertex ${vertexId}`);
  }

  /** Move the robber to a tile, find who to steal from */
  function moveRobber(tileId) {
    setRobberTileId(tileId);
    setGameState({ robberTileId: tileId });

    const tileVertices = vertices.filter((v) => v.tiles.includes(tileId));
    const owners = new Set();
    tileVertices.forEach((v) => {
      const foundSet = settlements.find((s) => s.vertexId === v.vertexId);
      if (foundSet) {
        owners.add(foundSet.owner);
      }
    });
    setPlayersToStealFrom(Array.from(owners));
  }

  function stealFromPlayer(victim) {
    console.log(`Steal from player: ${victim}`);
    setPlayersToStealFrom([]);
    setIsMovingRobber(false);
  }

  /** Dice rolling (Phase 9) */
  const [diceResult, setDiceResultState] = useState(null);
  function rollDice(rollerName) {
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const total = die1 + die2;

    setDiceResultState(total);

    console.log(`${rollerName} rolled a ${die1} + ${die2} = ${total}`);

    if (total === 7) {
      console.log('You rolled a 7! Move the robber!');
      setIsMovingRobber(true);
    } else {
      distributeResources(total);
    }
  }

  function distributeResources(total) {
    const matchingTiles = tiles.filter((t) => t.diceNumber === total && t.id !== robberTileId);
    const newResources = { ...playerResources };

    matchingTiles.forEach((tile) => {
      const tileVerts = vertices.filter((v) => v.tiles.includes(tile.id));
      tileVerts.forEach((vert) => {
        const foundSet = settlements.find((s) => s.vertexId === vert.vertexId);
        if (foundSet) {
          const owner = foundSet.owner;
          if (!newResources[owner]) {
            newResources[owner] = 0;
          }
          newResources[owner] += 1;
          console.log(`Player ${owner} gets +1 resource from tile #${tile.id}`);
        }
      });
    });

    setPlayerResources(newResources);
    setGameState({ playerResources: newResources });
  }

  // -------------------------------------------------------
  // Dev Card Functions
  // -------------------------------------------------------
  function drawDevCard(username) {
    if (devDeck.length === 0) {
      console.log('Dev deck is empty!');
      return;
    }
    // pay 1 resource
    const newResources = { ...playerResources };
    newResources[username] = (newResources[username] || 0) - 1;
    // draw top card
    const newDeck = [...devDeck];
    const card = newDeck.pop();

    // add to player's dev hand
    const newDevCards = { ...playerDevCards };
    if (!newDevCards[username]) {
      newDevCards[username] = [];
    }
    newDevCards[username] = [...newDevCards[username], card];

    // update state
    setPlayerResources(newResources);
    setDevDeck(newDeck);
    setPlayerDevCards(newDevCards);

    setGameState({
      playerResources: newResources,
      devDeck: newDeck,
      playerDevCards: newDevCards
    });

    console.log(`${username} drew a dev card: ${card}`);
  }

  function playDevCard(username, cardName) {
    // remove card from player's hand
    const playerHand = (playerDevCards[username] || []).slice();
    const cardIndex = playerHand.indexOf(cardName);
    if (cardIndex === -1) {
      console.log('Card not found in hand!');
      return;
    }
    playerHand.splice(cardIndex, 1);

    // apply effect
    switch (cardName) {
      case 'Knight':
        console.log(`${username} plays Knight -> must move robber`);
        setIsMovingRobber(true);
        break;
      case 'RoadBuilding':
        console.log(`${username} plays Road Building -> 2 free roads`);
        // We'll skip detailed adjacency checks and just let them build roads anywhere
        // For demonstration, we won't even automatically place them, 
        // but you could set a "road building" mode with a counter of 2 roads left.
        break;
      case 'YearOfPlenty':
        console.log(`${username} plays Year of Plenty -> +2 resources`);
        giveResources(username, 2);
        break;
      case 'Monopoly':
        console.log(`${username} plays Monopoly -> steal 2 resources from each other player`);
        doMonopoly(username, 2);
        break;
      case 'VictoryPoint':
        console.log(`${username} plays a Victory Point -> +1 resource (placeholder)`);
        giveResources(username, 1);
        break;
      default:
        console.log(`${username} plays an unknown card: ${cardName}`);
        break;
    }

    // finalize new dev card state
    const newDevCards = { ...playerDevCards };
    newDevCards[username] = playerHand;
    setPlayerDevCards(newDevCards);
    setGameState({ playerDevCards: newDevCards });
  }

  function giveResources(username, amount) {
    const newResources = { ...playerResources };
    newResources[username] = (newResources[username] || 0) + amount;
    setPlayerResources(newResources);
    setGameState({ playerResources: newResources });
  }

  function doMonopoly(username, amount) {
    const newResources = { ...playerResources };
    // each other player loses "amount", this player gains sum of that
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
    // add stolen to username
    newResources[username] = (newResources[username] || 0) + stolen;
    setPlayerResources(newResources);
    setGameState({ playerResources: newResources });
    console.log(`${username} stole a total of ${stolen} resources via Monopoly!`);
  }

  const contextValue = {
    // Basic game data
    players,
    tiles,
    edges,
    vertices,
    roads,
    settlements,

    // Resources & dev cards
    playerResources,
    devDeck,
    playerDevCards,

    // UI states
    selectedTile,
    setSelectedTile: (tile) => setSelectedTile(tile),
    isBuildingRoad,
    setIsBuildingRoad,
    isBuildingSettlement,
    setIsBuildingSettlement,

    // Robber
    isMovingRobber,
    setIsMovingRobber,
    robberTileId,
    playersToStealFrom,
    stealFromPlayer,
    moveRobber,

    // Dice
    diceResult,
    rollDice,

    // Build actions
    buildRoad,
    buildSettlement,

    // Dev card actions
    drawDevCard,
    playDevCard
  };

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
}
