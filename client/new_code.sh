#!/usr/bin/env bash

#############################################
# PHASE 6 UPDATE SCRIPT
# Adds basic road-building (edges + build menu)
#############################################

# 1) Update board_utils.js to generate edges between adjacent tiles
cat << 'EOF' > src/utils/board_utils.js
/**
 * board_utils.js
 * Helper functions for generating or manipulating the hex board layout.
 *
 * PHASE 6:
 * - We now also generate edges for each tile, merging shared edges among adjacent tiles.
 * - Each edge has a unique edgeId, references the two adjacent tiles, and has a midpoint for 3D rendering.
 */

const DEFAULT_RESOURCES = ['brick', 'wood', 'sheep', 'wheat', 'ore', 'desert'];
const diceNumbers = [2,3,4,5,6,8,9,10,11,12];

/**
 * generateHexBoard()
 * Creates the tile layout for a standard Catan board (3-4-5-4-3).
 * Returns an array of tile objects: { id, resource, diceNumber, position }
 */
export function generateHexBoard() {
  // Basic coords for a standard layout: 3-4-5-4-3
  const layout = [
    { rowLength: 3, yOffset: -2 },
    { rowLength: 4, yOffset: -1 },
    { rowLength: 5, yOffset: 0 },
    { rowLength: 4, yOffset: 1 },
    { rowLength: 3, yOffset: 2 },
  ];

  let tiles = [];
  let tileId = 1;

  for (let row = 0; row < layout.length; row++) {
    const { rowLength, yOffset } = layout[row];

    for (let col = 0; col < rowLength; col++) {
      const resource = randomResource();
      let diceNumber = null;
      if (resource !== 'desert') {
        diceNumber = randomDiceNumber();
      }

      // Position the hex
      const xPos = (col - (rowLength - 1)/2) * 1.8;
      const yPos = yOffset * 1.55;

      tiles.push({
        id: tileId++,
        resource,
        diceNumber,
        position: [xPos, yPos, 0],
      });
    }
  }

  return tiles;
}

/**
 * Generate a merged list of edges from the array of tiles.
 * Each edge references which tiles share it.
 */
export function generateEdges(tiles) {
  const edges = [];
  // We'll store them in a map to handle shared edges
  // Key: e.g. "x1,y1|x2,y2" (two endpoints)
  const edgeMap = new Map();

  // For each tile, define its 6 edges in local coordinates.
  // Then transform to world coords (position).
  tiles.forEach((tile) => {
    const tileCenter = tile.position;
    const tileEdges = getTileEdgeEndpoints(tileCenter);

    tileEdges.forEach((edge) => {
      const [p1, p2] = edge; // each is [x,y,z]
      // Create a canonical key so p1->p2 and p2->p1 are the same
      const key = makeEdgeKey(p1, p2);

      if (!edgeMap.has(key)) {
        // Create a new entry
        edgeMap.set(key, {
          edgeId: key,    // unique ID
          tiles: [tile.id],
          midpoint: midpoint3D(p1, p2),
          endpoints: [p1, p2]
        });
      } else {
        // If it exists, just add this tile to the edge's tile list
        const existing = edgeMap.get(key);
        if (!existing.tiles.includes(tile.id)) {
          existing.tiles.push(tile.id);
        }
      }
    });
  });

  // Convert map to array
  edgeMap.forEach((edgeObj) => {
    edges.push(edgeObj);
  });
  return edges;
}

/* ------------------ Internal Helpers ------------------ */

function randomResource() {
  return DEFAULT_RESOURCES[Math.floor(Math.random() * DEFAULT_RESOURCES.length)];
}

function randomDiceNumber() {
  return diceNumbers[Math.floor(Math.random() * diceNumbers.length)];
}

/**
 * Return the 6 edges of a hex (in world coords),
 * given the tile's center position [cx, cy, cz].
 * We'll place each corner at radius ~1 from the center for standard cylinderGeom.
 */
function getTileEdgeEndpoints([cx, cy, cz]) {
  const radius = 1; // hex radius
  const corners = [];
  // 6 corners around the hex
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + Math.PI / 6; // offset for flat-topped
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    corners.push([x, y, cz]);
  }

  // Edges are pairs: [c0->c1, c1->c2, c2->c3, ... c5->c0]
  const edges = [];
  for (let i = 0; i < 6; i++) {
    const c1 = corners[i];
    const c2 = corners[(i + 1) % 6];
    edges.push([c1, c2]);
  }
  return edges;
}

/**
 * Return a sorted string to identify an edge by its endpoints.
 * We'll sort by x,y,z so that the order doesn't matter.
 */
function makeEdgeKey(p1, p2) {
  // Convert to strings with 2 decimal places, then sort
  const s1 = p1.map((v) => v.toFixed(2)).join(',');
  const s2 = p2.map((v) => v.toFixed(2)).join(',');
  const sorted = [s1, s2].sort().join('|');
  return sorted;
}

function midpoint3D([x1, y1, z1], [x2, y2, z2]) {
  return [
    (x1 + x2) / 2,
    (y1 + y2) / 2,
    (z1 + z2) / 2
  ];
}
EOF

# 2) Update game_state_context.jsx to store roads, edges, and build mode
cat << 'EOF' > src/context/game_state_context.jsx
import React, { createContext, useEffect, useState } from 'react';
import { useSocket } from '../hooks/use_socket';
import { getGameState, setGameState } from '../services/game_service';
import { generateHexBoard, generateEdges } from '../utils/board_utils';

export const GameStateContext = createContext(null);

/**
 * Provides global game state + socket + building logic
 */
export function GameStateProvider({ children }) {
  const [players, setPlayers] = useState([]);
  const [tiles, setTiles] = useState([]);
  const [edges, setEdges] = useState([]);
  const [roads, setRoads] = useState([]); // each road => { edgeId, owner }
  const [selectedTile, setSelectedTile] = useState(null);

  // Build mode flags
  const [isBuildingRoad, setIsBuildingRoad] = useState(false);

  const socket = useSocket(); // Connect to server

  // On mount: generate board if we haven't yet
  useEffect(() => {
    const existingGameState = getGameState();

    // If no tiles in the game state, generate them
    if (!existingGameState.tiles) {
      const newTiles = generateHexBoard();
      const newEdges = generateEdges(newTiles);

      setGameState({ 
        tiles: newTiles,
        edges: newEdges,
        roads: []
      });
      setTiles(newTiles);
      setEdges(newEdges);
    } else {
      setTiles(existingGameState.tiles);
      setEdges(existingGameState.edges || []);
      setRoads(existingGameState.roads || []);
    }
  }, []);

  // Example: Let the server know we joined
  useEffect(() => {
    if (!socket) return;

    socket.emit('join-game', { playerName: 'DefaultPlayer' });

    // Listen for updated players
    const handlePlayersUpdate = (updatedPlayers) => {
      setPlayers(updatedPlayers);
      setGameState({ players: updatedPlayers });
    };

    socket.on('players-updated', handlePlayersUpdate);

    return () => {
      socket.off('players-updated', handlePlayersUpdate);
    };
  }, [socket]);

  // Periodically sync with game_service
  useEffect(() => {
    const gs = getGameState();
    if (gs.players && gs.players !== players) {
      setPlayers(gs.players);
    }
    if (gs.tiles && gs.tiles !== tiles) {
      setTiles(gs.tiles);
    }
    if (gs.edges && gs.edges !== edges) {
      setEdges(gs.edges);
    }
    if (gs.roads && gs.roads !== roads) {
      setRoads(gs.roads);
    }
  }, [players, tiles, edges, roads]);

  function handleSelectTile(tile) {
    setSelectedTile(tile);
  }

  /**
   * Attempt to build a road on an edge
   */
  function buildRoad(edgeId, owner) {
    // Check if there's already a road on this edge
    const existing = roads.find(r => r.edgeId === edgeId);
    if (existing) {
      console.log('Edge already has a road!');
      return;
    }

    // For real game: resource checks, adjacency checks, etc.
    const newRoad = { edgeId, owner };
    const updatedRoads = [...roads, newRoad];
    setRoads(updatedRoads);
    setGameState({ roads: updatedRoads });

    console.log(`Road built by ${owner} on edge ${edgeId}`);
  }

  const contextValue = {
    players,
    setPlayers,
    tiles,
    setTiles,
    edges,
    roads,
    selectedTile,
    setSelectedTile: handleSelectTile,

    // Build mode
    isBuildingRoad,
    setIsBuildingRoad,

    // Build actions
    buildRoad
  };

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
}
EOF

# 3) Add/Update a new Build Menu component
mkdir -p src/components/build_menu
cat << 'EOF' > src/components/build_menu/build_menu.jsx
import React from 'react';
import { useGameState } from '../../hooks/use_game_state';
import { useAuth } from '../../hooks/use_auth';
import './build_menu.css';

/**
 * BuildMenu:
 * - A simple UI with a button to toggle "Build Road" mode.
 * - Future expansions: Build Settlement, Build City, etc.
 */
export default function BuildMenu() {
  const { isBuildingRoad, setIsBuildingRoad } = useGameState();
  const { user } = useAuth();

  const toggleBuildRoad = () => {
    // Must be logged in to build
    if (!user) {
      alert('You must be logged in to build roads!');
      return;
    }
    setIsBuildingRoad(!isBuildingRoad);
  };

  return (
    <div className="build-menu">
      <h3>Build Menu</h3>
      <button
        className={isBuildingRoad ? 'active' : ''}
        onClick={toggleBuildRoad}
      >
        {isBuildingRoad ? 'Cancel Road' : 'Build Road'}
      </button>
    </div>
  );
}
EOF

cat << 'EOF' > src/components/build_menu/build_menu.css
.build-menu {
  background-color: #fffaf0;
  border: 1px solid #ccc;
  padding: 10px;
  width: 120px;
  text-align: center;
}

.build-menu button.active {
  background-color: #ffa;
  border: 2px solid #555;
}
EOF

cat << 'EOF' > src/components/build_menu/index.js
export { default } from './build_menu.jsx';
EOF

# 4) Update board_scene.jsx to render edges and allow building roads
cat << 'EOF' > src/components/board_scene/board_scene.jsx
import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useGameState } from '../../hooks/use_game_state';
import './board_scene.css';

export default function BoardScene() {
  const { tiles, edges } = useGameState();

  return (
    <div className="board-scene-container">
      <Canvas camera={{ position: [0, 0, 10] }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 10]} intensity={0.5} />

        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />

        {/* Tiles */}
        {tiles.map((tile) => (
          <HexTile key={tile.id} tile={tile} />
        ))}

        {/* Edges */}
        {edges.map((edgeObj) => (
          <EdgeLine key={edgeObj.edgeId} edgeObj={edgeObj} />
        ))}
      </Canvas>
    </div>
  );
}

/** Hex Tile (unchanged from prior phase, except we read setSelectedTile from context) */
function HexTile({ tile }) {
  const meshRef = useRef();
  const { setSelectedTile } = useGameState();

  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    // if (meshRef.current) meshRef.current.rotation.z += 0.0005;
  });

  const handleClick = () => {
    setSelectedTile(tile);
  };

  return (
    <mesh
      ref={meshRef}
      position={tile.position}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      onClick={(e) => { e.stopPropagation(); handleClick(); }}
    >
      <cylinderGeometry args={[1, 1, 0.1, 6]} />
      <meshStandardMaterial color={getTileColor(tile, hovered)} />
    </mesh>
  );
}

/** Renders an edge line or a "road" if built. */
function EdgeLine({ edgeObj }) {
  const { roads, buildRoad, isBuildingRoad } = useGameState();
  const { edgeId, midpoint, endpoints } = edgeObj;

  // Check if this edge already has a road
  const road = roads.find(r => r.edgeId === edgeId);

  const [hovered, setHovered] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    if (!isBuildingRoad) return;
    // Build road for current user
    buildRoad(edgeId, 'SomePlayer'); // We'll refine "owner" later
  };

  // We'll create a simple line or cylinder from endpoints
  // react-three-fiber typically uses <line> or you can do a cylinder trick
  const color = road ? getPlayerColor(road.owner) : (hovered ? 'yellow' : 'white');

  return (
    <group>
      {/* We draw a cylinder from p1->p2 to visualize the edge */}
      <EdgeCylinder
        endpoints={endpoints}
        color={color}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
        onClick={handleClick}
      />
    </group>
  );
}

/** The actual 3D cylinder that represents an edge or road */
function EdgeCylinder({ endpoints, color, onPointerOver, onPointerOut, onClick }) {
  const [p1, p2] = endpoints;

  // Calculate mid position
  const mx = (p1[0] + p2[0]) / 2;
  const my = (p1[1] + p2[1]) / 2;
  const mz = (p1[2] + p2[2]) / 2;

  // Calculate length
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const dz = p2[2] - p1[2];
  const length = Math.sqrt(dx*dx + dy*dy + dz*dz);

  // Rotation: for 2D top-down, we can do a rotation around Z
  // But let's do a full 3D rotation
  // We'll compute the direction vector and build a quaternion. 
  // For simplicity, let's skip advanced math: we can do a naive approach with "lookAt" or similar.

  // We'll create a ref and use "lookAt" in a frame
  const cylinderRef = useRef();

  useFrame(() => {
    if (cylinderRef.current) {
      cylinderRef.current.position.set(mx, my, mz);
      // point the cylinder along the direction from p1->p2
      // 'lookAt' the second endpoint
      cylinderRef.current.lookAt(p2[0], p2[1], p2[2]);
      // rotate so that the cylinder's Y-axis is the length axis
      cylinderRef.current.rotation.x += Math.PI/2;
    }
  });

  return (
    <mesh
      ref={cylinderRef}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      {/* radiusTop, radiusBottom, height, radialSegments */}
      <cylinderGeometry args={[0.05, 0.05, length, 8]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

/** Helpers for tile and road colors */
function getTileColor(tile, hovered) {
  const base = getResourceColor(tile.resource);
  if (hovered) {
    return hoverColor(base);
  }
  return base;
}

function getResourceColor(resource) {
  switch(resource) {
    case 'brick': return 'brown';
    case 'wood': return 'green';
    case 'sheep': return 'lightgreen';
    case 'wheat': return 'gold';
    case 'ore': return 'gray';
    case 'desert': return 'sandybrown';
    default: return 'white';
  }
}

function hoverColor(baseColor) {
  if (baseColor === 'brown') return '#a0522d';
  if (baseColor === 'green') return '#32cd32';
  if (baseColor === 'lightgreen') return '#90ee90';
  if (baseColor === 'gold') return '#ffd700';
  if (baseColor === 'gray') return '#b0b0b0';
  if (baseColor === 'sandybrown') return '#f4a460';
  return 'lightgray';
}

function getPlayerColor(owner) {
  // For now, color roads orange by default or choose by owner name
  if (!owner) return 'orange';
  if (owner === 'SomePlayer') return 'red';
  // Extend logic for multiple players
  return 'orange';
}
EOF

# 5) Finally, update game_page.jsx to include BuildMenu
cat << 'EOF' > src/components/game_page/game_page.jsx
import React, { useEffect } from 'react';
import { useGameState } from '../../hooks/use_game_state';
import BoardScene from '../board_scene/board_scene';
import ChatBox from '../chat_box/chat_box';
import BuildMenu from '../build_menu/build_menu';
import './game_page.css';

export default function GamePage() {
  const { players, selectedTile } = useGameState();

  // Log whenever players change
  useEffect(() => {
    console.log('[GamePage] players updated:', players);
  }, [players]);

  return (
    <div className="game-page">
      <h2>Hex Island</h2>
      <p>Now you can build basic roads. Click "Build Road," then click an edge.</p>

      <div className="game-layout">
        <div className="board-section">
          <BoardScene />
          {selectedTile && (
            <div className="selected-tile-info">
              <h3>Selected Tile</h3>
              <p><strong>Resource:</strong> {selectedTile.resource}</p>
              <p><strong>Dice #:</strong> {selectedTile.diceNumber || 'None'}</p>
              <p><strong>Tile ID:</strong> {selectedTile.id}</p>
            </div>
          )}
        </div>

        <div className="sidebar">
          <ChatBox />
          <BuildMenu />
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>Players in the game:</h3>
        <ul>
          {players.map((p, idx) => (
            <li key={idx}>{p}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
EOF

# 6) Update game_page.css to position BuildMenu under ChatBox
cat << 'EOF' > src/components/game_page/game_page.css
.game-page {
  text-align: center;
  padding: 20px;
}

.game-layout {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  margin-top: 20px;
}

.board-section {
  position: relative;
}

.selected-tile-info {
  margin-top: 10px;
  background-color: #fafafa;
  border: 1px solid #ccc;
  padding: 10px;
  width: 180px;
  margin: 0 auto;
}

.sidebar {
  display: flex;
  flex-direction: column;
  margin-left: 20px;
  gap: 20px;
}
EOF

echo "Phase 6 files created/updated successfully!"
echo "Next steps:"
echo "1) Run 'npm start' and navigate to /game."
echo "2) Click 'Build Road' in the Build Menu, then click an edge on the board. A road appears!"
echo "3) We skip resource or adjacency checks for now. Later, you can refine logic in buildRoad()."
echo "4) Enjoy basic road-building, completing another chunk of the original Angular app's functionality."