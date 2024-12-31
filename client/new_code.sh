#!/usr/bin/env bash

#############################################
# PHASE 7 UPDATE SCRIPT
# Adds basic settlement-building at vertices
#############################################

# 1) Update board_utils.js with generateVertices()
cat << 'EOF' > src/utils/board_utils.js
/**
 * board_utils.js
 * Helper functions for generating or manipulating the hex board layout.
 * Now includes vertex generation for settlements (Phase 7).
 */

const DEFAULT_RESOURCES = ['brick', 'wood', 'sheep', 'wheat', 'ore', 'desert'];
const diceNumbers = [2,3,4,5,6,8,9,10,11,12];

export function generateHexBoard() {
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
 * Generate edges for roads (unchanged)
 */
export function generateEdges(tiles) {
  const edges = [];
  const edgeMap = new Map();

  tiles.forEach((tile) => {
    const tileCenter = tile.position;
    const tileEdges = getTileEdgeEndpoints(tileCenter);

    tileEdges.forEach((edge) => {
      const [p1, p2] = edge;
      const key = makeEdgeKey(p1, p2);

      if (!edgeMap.has(key)) {
        edgeMap.set(key, {
          edgeId: key,
          tiles: [tile.id],
          midpoint: midpoint3D(p1, p2),
          endpoints: [p1, p2],
        });
      } else {
        const existing = edgeMap.get(key);
        if (!existing.tiles.includes(tile.id)) {
          existing.tiles.push(tile.id);
        }
      }
    });
  });

  edgeMap.forEach((edgeObj) => edges.push(edgeObj));
  return edges;
}

/**
 * Generate vertices for settlements.
 * Each tile has 6 corners. Merge corners that are shared among multiple tiles.
 */
export function generateVertices(tiles) {
  const vertexMap = new Map();

  tiles.forEach((tile) => {
    const tileCenter = tile.position;
    const corners = getHexCorners(tileCenter);  // 6 corners

    corners.forEach((corner) => {
      const key = pointKey(corner);
      if (!vertexMap.has(key)) {
        vertexMap.set(key, {
          vertexId: key,
          position: corner,
          tiles: [tile.id],
        });
      } else {
        const existing = vertexMap.get(key);
        if (!existing.tiles.includes(tile.id)) {
          existing.tiles.push(tile.id);
        }
      }
    });
  });

  const vertices = [];
  vertexMap.forEach((v) => vertices.push(v));
  return vertices;
}

/* -------------------- Internal Helpers -------------------- */

function randomResource() {
  return DEFAULT_RESOURCES[Math.floor(Math.random() * DEFAULT_RESOURCES.length)];
}

function randomDiceNumber() {
  return diceNumbers[Math.floor(Math.random() * diceNumbers.length)];
}

function getTileEdgeEndpoints([cx, cy, cz]) {
  const radius = 1;
  const corners = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + Math.PI / 6;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    corners.push([x, y, cz]);
  }

  const edges = [];
  for (let i = 0; i < 6; i++) {
    const c1 = corners[i];
    const c2 = corners[(i + 1) % 6];
    edges.push([c1, c2]);
  }
  return edges;
}

function makeEdgeKey(p1, p2) {
  const s1 = p1.map((v) => v.toFixed(2)).join(',');
  const s2 = p2.map((v) => v.toFixed(2)).join(',');
  const sorted = [s1, s2].sort().join('|');
  return sorted;
}

function midpoint3D([x1, y1, z1], [x2, y2, z2]) {
  return [(x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2];
}

/**
 * Return the 6 corners of a tile for vertices.
 */
function getHexCorners([cx, cy, cz]) {
  const radius = 1;
  const corners = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + Math.PI / 6;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    corners.push([x, y, cz]);
  }
  return corners;
}

/**
 * Round the coordinates to make a stable key for vertex merging.
 */
function pointKey(point) {
  return point.map((v) => v.toFixed(2)).join(',');
}
EOF

# 2) Update game_state_context.jsx with vertices & settlements
cat << 'EOF' > src/context/game_state_context.jsx
import React, { createContext, useEffect, useState } from 'react';
import { useSocket } from '../hooks/use_socket';
import { getGameState, setGameState } from '../services/game_service';
import { generateHexBoard, generateEdges, generateVertices } from '../utils/board_utils';

export const GameStateContext = createContext(null);

export function GameStateProvider({ children }) {
  const [players, setPlayers] = useState([]);
  const [tiles, setTiles] = useState([]);
  const [edges, setEdges] = useState([]);
  const [vertices, setVertices] = useState([]); // For settlements
  const [roads, setRoads] = useState([]);
  const [settlements, setSettlements] = useState([]); // Each => { vertexId, owner }

  const [selectedTile, setSelectedTile] = useState(null);

  // Build mode flags
  const [isBuildingRoad, setIsBuildingRoad] = useState(false);
  const [isBuildingSettlement, setIsBuildingSettlement] = useState(false);

  const socket = useSocket();

  // On mount: generate board if we haven't
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
        settlements: []
      });

      setTiles(newTiles);
      setEdges(newEdges);
      setVertices(newVertices);
    } else {
      setTiles(existingGameState.tiles);
      setEdges(existingGameState.edges || []);
      setVertices(existingGameState.vertices || []);
      setRoads(existingGameState.roads || []);
      setSettlements(existingGameState.settlements || []);
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
  }, [players, tiles, edges, vertices, roads, settlements]);

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

  const contextValue = {
    players,
    tiles,
    edges,
    vertices,
    roads,
    settlements,
    selectedTile,

    isBuildingRoad,
    setIsBuildingRoad,
    isBuildingSettlement,
    setIsBuildingSettlement,

    setSelectedTile: (tile) => setSelectedTile(tile),
    buildRoad,
    buildSettlement
  };

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
}
EOF

# 3) Update build_menu.jsx to add a "Build Settlement" button
cat << 'EOF' > src/components/build_menu/build_menu.jsx
import React from 'react';
import { useGameState } from '../../hooks/use_game_state';
import { useAuth } from '../../hooks/use_auth';
import './build_menu.css';

export default function BuildMenu() {
  const {
    isBuildingRoad, setIsBuildingRoad,
    isBuildingSettlement, setIsBuildingSettlement
  } = useGameState();

  const { user } = useAuth();

  const toggleBuildRoad = () => {
    if (!user) {
      alert('You must be logged in to build roads!');
      return;
    }
    setIsBuildingSettlement(false); // turn off settlement mode if on
    setIsBuildingRoad(!isBuildingRoad);
  };

  const toggleBuildSettlement = () => {
    if (!user) {
      alert('You must be logged in to build settlements!');
      return;
    }
    setIsBuildingRoad(false); // turn off road mode if on
    setIsBuildingSettlement(!isBuildingSettlement);
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
      <button
        className={isBuildingSettlement ? 'active' : ''}
        onClick={toggleBuildSettlement}
        style={{ marginTop: '10px' }}
      >
        {isBuildingSettlement ? 'Cancel Settlement' : 'Build Settlement'}
      </button>
    </div>
  );
}
EOF

# 4) Update board_scene.jsx to draw & interact with vertices + show settlements
cat << 'EOF' > src/components/board_scene/board_scene.jsx
import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useGameState } from '../../hooks/use_game_state';
import './board_scene.css';

export default function BoardScene() {
  const { tiles, edges, vertices, roads, settlements } = useGameState();

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

        {/* Edges (for roads) */}
        {edges.map((edgeObj) => (
          <EdgeLine key={edgeObj.edgeId} edgeObj={edgeObj} roads={roads} />
        ))}

        {/* Vertices (for settlements) */}
        {vertices.map((vertex) => {
          const settlement = settlements.find(s => s.vertexId === vertex.vertexId);
          return (
            <VertexMarker
              key={vertex.vertexId}
              vertex={vertex}
              settlement={settlement}
            />
          );
        })}
      </Canvas>
    </div>
  );
}

/** Hex Tile */
function HexTile({ tile }) {
  const meshRef = useRef();
  const { setSelectedTile } = useGameState();

  const [hovered, setHovered] = useState(false);

  useFrame(() => {});

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

/** EdgeLine for roads */
function EdgeLine({ edgeObj, roads }) {
  const { buildRoad, isBuildingRoad } = useGameState();
  const { edgeId, endpoints } = edgeObj;
  const road = roads.find(r => r.edgeId === edgeId);

  const [hovered, setHovered] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    if (!isBuildingRoad) return;
    if (road) {
      console.log('Edge already has a road!');
      return;
    }
    buildRoad(edgeId, 'SomePlayer'); // Expand to real user later
  };

  const color = road ? getPlayerColor(road.owner) : (hovered ? 'yellow' : 'white');

  return (
    <EdgeCylinder
      endpoints={endpoints}
      color={color}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      onClick={handleClick}
    />
  );
}

/** VertexMarker for building or displaying a settlement */
function VertexMarker({ vertex, settlement }) {
  const { buildSettlement, isBuildingSettlement } = useGameState();
  const [hovered, setHovered] = useState(false);
  const markerRef = useRef();

  const handleClick = (e) => {
    e.stopPropagation();
    if (!isBuildingSettlement) return;
    if (settlement) {
      console.log('Vertex already has a settlement!');
      return;
    }
    buildSettlement(vertex.vertexId, 'SomePlayer');
  };

  useFrame(() => {
    if (markerRef.current) {
      // optional spin or animation
    }
  });

  // If there's a settlement here, show it in the settlement's color
  if (settlement) {
    return (
      <mesh
        ref={markerRef}
        position={vertex.position}
      >
        {/* For simplicity, draw a small box or sphere */}
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color={getPlayerColor(settlement.owner)} />
      </mesh>
    );
  }

  // Otherwise, just draw a small invisible "click zone" or a small sphere
  return (
    <mesh
      ref={markerRef}
      position={vertex.position}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      onClick={handleClick}
    >
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshStandardMaterial
        color={hovered ? 'yellow' : 'transparent'}
        opacity={hovered ? 1 : 0.4}
        transparent
      />
    </mesh>
  );
}

/** A 3D cylinder representing an edge/road */
function EdgeCylinder({ endpoints, color, onPointerOver, onPointerOut, onClick }) {
  const [p1, p2] = endpoints;
  const cylinderRef = useRef();

  // Compute midpoint
  const mx = (p1[0] + p2[0]) / 2;
  const my = (p1[1] + p2[1]) / 2;
  const mz = (p1[2] + p2[2]) / 2;

  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const dz = p2[2] - p1[2];
  const length = Math.sqrt(dx*dx + dy*dy + dz*dz);

  useFrame(() => {
    if (cylinderRef.current) {
      cylinderRef.current.position.set(mx, my, mz);
      cylinderRef.current.lookAt(p2[0], p2[1], p2[2]);
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
      <cylinderGeometry args={[0.05, 0.05, length, 8]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

/** Colors for tiles, roads, and settlements */
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
  if (!owner) return 'orange';
  if (owner === 'SomePlayer') return 'red';
  return 'orange';
}
EOF

echo "Phase 7 files created/updated successfully!"
echo "Next steps:"
echo "1) Run 'npm start' and navigate to /game."
echo "2) Click 'Build Settlement' in the Build Menu, then click a vertex (corner). A small box appears as your settlement!"
echo "3) You can still 'Build Road' on edges. We'll refine resource checks, adjacency rules, etc., in future expansions."
echo "4) Enjoy basic settlement-building, completing another big piece of the original Angular app's functionality!"