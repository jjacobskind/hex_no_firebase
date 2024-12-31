import React, { createContext, useEffect, useState } from 'react';
import { useSocket } from '../hooks/use_socket';
import { getGameState, setGameState } from '../services/game_service';
import {
  generateHexBoard,
  generateEdges,
  generateVertices
} from '../utils/board_utils';

export const GameStateContext = createContext(null);

/**
 * We'll define a resource set as an object with keys: wood, brick, wheat, sheep, ore.
 * For convenience, we might store them in uppercase or keep them lowercase.
 */
function emptyResources() {
  return { wood: 0, brick: 0, wheat: 0, sheep: 0, ore: 0 };
}

// Basic dev card array from prior phases
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

/** 
 * Merge two resource objects, adding amounts together. 
 * e.g. addResources({wood:1,brick:0}, {wood:2,brick:2}) => {wood:3, brick:2}
 */
function addResources(a, b) {
  return {
    wood: (a.wood || 0) + (b.wood || 0),
    brick: (a.brick || 0) + (b.brick || 0),
    wheat: (a.wheat || 0) + (b.wheat || 0),
    sheep: (a.sheep || 0) + (b.sheep || 0),
    ore: (a.ore || 0) + (b.ore || 0),
  };
}

/** 
 * Subtract b from a, e.g. subResources(a,b) => a-b. 
 * We won't do safety checks here—real logic belongs on the server.
 */
function subResources(a, b) {
  return {
    wood: (a.wood || 0) - (b.wood || 0),
    brick: (a.brick || 0) - (b.brick || 0),
    wheat: (a.wheat || 0) - (b.wheat || 0),
    sheep: (a.sheep || 0) - (b.sheep || 0),
    ore: (a.ore || 0) - (b.ore || 0),
  };
}

/** 
 * Check if a has at least as many of each resource as b. 
 * e.g. canAfford(a,b) => boolean
 */
function canAfford(a, b) {
  return (
    a.wood >= b.wood &&
    a.brick >= b.brick &&
    a.wheat >= b.wheat &&
    a.sheep >= b.sheep &&
    a.ore >= b.ore
  );
}

/** Build costs for major items */
const COST_ROAD = { wood: 1, brick: 1 };
const COST_SETTLEMENT = { wood: 1, brick: 1, wheat: 1, sheep: 1 };
// For demonstration, no city, or you can add { ore:3, wheat:2 } if you like

export function GameStateProvider({ children }) {
  const [players, setPlayers] = useState([]);
  const [tiles, setTiles] = useState([]);
  const [edges, setEdges] = useState([]);
  const [vertices, setVertices] = useState([]);
  const [roads, setRoads] = useState([]);
  const [settlements, setSettlements] = useState([]);

  // Now, for multi-resource, playerResources: { [playerName]: {wood,brick,wheat,sheep,ore} }
  const [playerResources, setPlayerResources] = useState({});

  // Victory points remain the same
  const [playerVictoryPoints, setPlayerVictoryPoints] = useState({});

  // Titles from prior phases
  const [longestRoadOwner, setLongestRoadOwner] = useState(null);
  const [longestRoadLength, setLongestRoadLength] = useState(0);
  const [largestArmyOwner, setLargestArmyOwner] = useState(null);
  const [largestArmySize, setLargestArmySize] = useState(0);
  const [playerKnightsPlayed, setPlayerKnightsPlayed] = useState({});

  const [selectedTile, setSelectedTile] = useState(null);

  const [isBuildingRoad, setIsBuildingRoad] = useState(false);
  const [isBuildingSettlement, setIsBuildingSettlement] = useState(false);

  const [isMovingRobber, setIsMovingRobber] = useState(false);
  const [robberTileId, setRobberTileId] = useState(null);
  const [playersToStealFrom, setPlayersToStealFrom] = useState([]);

  const [diceResult, setDiceResult] = useState(null);

  const [devDeck, setDevDeck] = useState([...INITIAL_DEV_DECK]);
  const [playerDevCards, setPlayerDevCards] = useState({});

  const [pendingTrade, setPendingTrade] = useState(null);

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [winner, setWinner] = useState(null);

  const socket = useSocket();

  function currentUserName() {
    return 'DefaultPlayer'; // Example placeholder
  }

  // On initial load
  useEffect(() => {
    const existing = getGameState();
    if (!existing.tiles) {
      // brand new
      const newTiles = generateHexBoard();
      const newEdges = generateEdges(newTiles);
      const newVertices = generateVertices(newTiles);
      const defaultPlayers = ['Alice', 'Bob'];

      const newRes = {};
      defaultPlayers.forEach((p) => {
        newRes[p] = emptyResources();
      });

      const initState = {
        players: defaultPlayers,
        tiles: newTiles,
        edges: newEdges,
        vertices: newVertices,
        roads: [],
        settlements: [],
        robberTileId: null,
        playerResources: newRes,
        playerVictoryPoints: {},
        devDeck,
        playerDevCards: {},
        pendingTrade: null,
        currentPlayerIndex: 0,
        winner: null,
        longestRoadOwner: null,
        longestRoadLength: 0,
        largestArmyOwner: null,
        largestArmySize: 0,
        playerKnightsPlayed: {}
      };

      setGameState(initState);
      setPlayers(defaultPlayers);
      setTiles(newTiles);
      setEdges(newEdges);
      setVertices(newVertices);
      setPlayerResources(newRes);
    } else {
      // hydrate from existing
      setPlayers(existing.players || []);
      setTiles(existing.tiles || []);
      setEdges(existing.edges || []);
      setVertices(existing.vertices || []);
      setRoads(existing.roads || []);
      setSettlements(existing.settlements || []);
      setRobberTileId(existing.robberTileId || null);
      setPlayerResources(existing.playerResources || {});
      setPlayerVictoryPoints(existing.playerVictoryPoints || {});
      setDevDeck(existing.devDeck || devDeck);
      setPlayerDevCards(existing.playerDevCards || {});
      setPendingTrade(existing.pendingTrade || null);
      setCurrentPlayerIndex(existing.currentPlayerIndex || 0);
      setWinner(existing.winner || null);
      setLongestRoadOwner(existing.longestRoadOwner || null);
      setLongestRoadLength(existing.longestRoadLength || 0);
      setLargestArmyOwner(existing.largestArmyOwner || null);
      setLargestArmySize(existing.largestArmySize || 0);
      setPlayerKnightsPlayed(existing.playerKnightsPlayed || {});
    }
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join-game', { playerName: 'DefaultPlayer' });
  }, [socket]);

  // We skip continuous sync code for brevity

  // -------------------------------------------------
  // Example: Build a Road with real resource cost
  // -------------------------------------------------
  function buildRoad(edgeId, owner) {
    // check if there's already a road
    if (roads.some((r) => r.edgeId === edgeId)) {
      console.log('Road already exists on this edge!');
      return;
    }
    // check resource cost
    const currentRes = playerResources[owner] || emptyResources();
    if (!canAfford(currentRes, COST_ROAD)) {
      console.log(`${owner} cannot afford a road! Need wood=1,brick=1`);
      return;
    }
    // subtract resources
    const updatedOwnerRes = subResources(currentRes, COST_ROAD);
    // add the road
    const newRoads = [...roads, { edgeId, owner }];

    // now update state
    const newPlayerResMap = { ...playerResources, [owner]: updatedOwnerRes };
    setRoads(newRoads);
    setPlayerResources(newPlayerResMap);

    // in real usage, recalcLongestRoad, etc.
    // We'll keep it short for demonstration
    setGameState({
      roads: newRoads,
      playerResources: newPlayerResMap
    });
    console.log(`${owner} built a Road (cost 1 wood + 1 brick).`);
  }

  // -------------------------------------------------
  // Build a Settlement (cost 1 wood + 1 brick + 1 wheat + 1 sheep)
  // -------------------------------------------------
  function buildSettlement(vertexId, owner) {
    // check if a settlement already there
    if (settlements.some((s) => s.vertexId === vertexId)) {
      console.log('That vertex is already occupied!');
      return;
    }
    // resource cost
    const currentRes = playerResources[owner] || emptyResources();
    if (!canAfford(currentRes, COST_SETTLEMENT)) {
      console.log(`${owner} cannot afford a Settlement! Need wood=1,brick=1,wheat=1,sheep=1`);
      return;
    }
    const updatedOwnerRes = subResources(currentRes, COST_SETTLEMENT);
    // add new settlement
    const newSetts = [...settlements, { vertexId, owner }];

    // update state
    const newResMap = { ...playerResources, [owner]: updatedOwnerRes };
    setSettlements(newSetts);
    setPlayerResources(newResMap);

    // awarding 1 victory point for demonstration
    const newVP = { ...playerVictoryPoints };
    newVP[owner] = (newVP[owner] || 0) + 1;

    let newWinner = winner;
    if (newVP[owner] >= 10) {
      newWinner = owner;
      console.log(`${owner} reached 10 VP => wins!`);
    }

    setPlayerVictoryPoints(newVP);
    setGameState({
      settlements: newSetts,
      playerResources: newResMap,
      playerVictoryPoints: newVP,
      winner: newWinner
    });
    if (newWinner) {
      setWinner(newWinner);
    }
    console.log(`${owner} built a Settlement at vertex=${vertexId}, costing 1 of each resource.`);
  }

  // -------------------------------------------------
  // Distribute resources by tile type on dice roll
  // -------------------------------------------------
  function distributeResources(diceTotal) {
    // e.g. find tiles with diceNumber == diceTotal and resource != 'desert'
    const matchingTiles = tiles.filter((t) => t.diceNumber === diceTotal && t.resource !== 'desert');
    // if robberTileId is on a tile with diceNumber == diceTotal, that tile is blocked => skip it

    const newResMap = { ...playerResources };

    matchingTiles.forEach((tile) => {
      if (tile.id === robberTileId) {
        console.log(`Tile #${tile.id} is blocked by robber!`);
        return;
      }
      // find all settlements on tile’s corners
      const tileVerts = vertices.filter((v) => v.tiles.includes(tile.id));
      tileVerts.forEach((vert) => {
        const foundSet = settlements.find((s) => s.vertexId === vert.vertexId);
        if (foundSet) {
          const owner = foundSet.owner;
          // award +1 tile.resource
          if (!newResMap[owner]) {
            newResMap[owner] = emptyResources();
          }
          newResMap[owner][tile.resource] = (newResMap[owner][tile.resource] || 0) + 1;
          console.log(`Player ${owner} gets +1 ${tile.resource} from tile #${tile.id}.`);
        }
      });
    });

    setPlayerResources(newResMap);
    setGameState({ playerResources: newResMap });
  }

  // We skip advanced logic for road continuity, dev cards, etc. from prior phases, to keep it short.

  const contextValue = {
    players,
    tiles,
    edges,
    vertices,
    roads,
    settlements,
    playerResources,
    playerVictoryPoints,

    buildRoad,
    buildSettlement,
    distributeResources,

    // ... plus everything from prior phases (largestArmy, longestRoad, dev cards, etc.)
    // We omit them for brevity here—feel free to unify.
  };

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
}
