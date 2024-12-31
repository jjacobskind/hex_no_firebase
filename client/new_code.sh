#!/usr/bin/env bash

#############################################
# PHASE 8 UPDATE SCRIPT
# Adds basic robber logic (move robber, steal)
#############################################

# 1) Create/Update robber_control component
mkdir -p src/components/robber_control
cat << 'EOF' > src/components/robber_control/robber_control.jsx
import React, { useState } from 'react';
import { useGameState } from '../../hooks/use_game_state';
import './robber_control.css';

/**
 * RobberControl:
 * - A button to toggle "Move Robber" mode
 * - If robber is placed, we show which tile it is on.
 * - If just placed, pick a neighbor player to steal from (placeholder).
 */
export default function RobberControl() {
  const {
    isMovingRobber,
    setIsMovingRobber,
    robberTileId,
    playersToStealFrom,
    stealFromPlayer
  } = useGameState();

  const [chosenPlayer, setChosenPlayer] = useState('');

  const toggleMoveRobber = () => {
    setIsMovingRobber(!isMovingRobber);
  };

  const handleSteal = () => {
    if (!chosenPlayer) return;
    stealFromPlayer(chosenPlayer);
    setChosenPlayer('');
  };

  return (
    <div className="robber-control">
      <h3>Robber Control</h3>
      <button
        className={isMovingRobber ? 'active' : ''}
        onClick={toggleMoveRobber}
      >
        {isMovingRobber ? 'Cancel Robber Move' : 'Move Robber'}
      </button>

      {robberTileId && (
        <div className="robber-info">
          <p>Robber is on tile: <strong>{robberTileId}</strong></p>
        </div>
      )}

      {playersToStealFrom.length > 0 && (
        <div className="robber-steal">
          <p>Pick a player to steal from:</p>
          <select
            value={chosenPlayer}
            onChange={(e) => setChosenPlayer(e.target.value)}
          >
            <option value="">-- choose --</option>
            {playersToStealFrom.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button onClick={handleSteal} disabled={!chosenPlayer}>
            Steal
          </button>
        </div>
      )}
    </div>
  );
}
EOF

cat << 'EOF' > src/components/robber_control/robber_control.css
.robber-control {
  background-color: #ffe4e1;
  border: 1px solid #ccc;
  padding: 10px;
  width: 120px;
  text-align: center;
}

.robber-control button.active {
  background-color: #ffa;
  border: 2px solid #555;
}

.robber-info {
  margin-top: 10px;
  background-color: #fff8dc;
  padding: 5px;
}

.robber-steal {
  margin-top: 10px;
}
EOF

cat << 'EOF' > src/components/robber_control/index.js
export { default } from './robber_control.jsx';
EOF

# 2) Update the GameStateContext to store robberTileId, isMovingRobber, etc.
cat << 'EOF' > src/context/game_state_context.jsx
import React, { createContext, useEffect, useState } from 'react';
import { useSocket } from '../hooks/use_socket';
import { getGameState, setGameState } from '../services/game_service';
import {
  generateHexBoard,
  generateEdges,
  generateVertices
} from '../utils/board_utils';

export const GameStateContext = createContext(null);

export function GameStateProvider({ children }) {
  const [players, setPlayers] = useState([]);
  const [tiles, setTiles] = useState([]);
  const [edges, setEdges] = useState([]);
  const [vertices, setVertices] = useState([]);
  const [roads, setRoads] = useState([]);
  const [settlements, setSettlements] = useState([]);

  const [selectedTile, setSelectedTile] = useState(null);

  // Build modes
  const [isBuildingRoad, setIsBuildingRoad] = useState(false);
  const [isBuildingSettlement, setIsBuildingSettlement] = useState(false);

  // Robber state
  const [isMovingRobber, setIsMovingRobber] = useState(false);
  const [robberTileId, setRobberTileId] = useState(null);
  // After placing robber, we find which players to steal from
  const [playersToStealFrom, setPlayersToStealFrom] = useState([]);

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
        robberTileId: null
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
  }, [players, tiles, edges, vertices, roads, settlements, robberTileId]);

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

  /**
   * Move the robber to a tile
   * Then find which players can be stolen from (who have settlements on this tile).
   */
  function moveRobber(tileId) {
    setRobberTileId(tileId);
    setGameState({ robberTileId: tileId });
    // Now see which players have a settlement on that tile's corners
    const tileVertices = vertices.filter((v) => v.tiles.includes(tileId));
    // For each vertex, if there's a settlement, gather the owner
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
    // For now, just log it
    console.log(`Steal from player: ${victim}`);
    // In a real game, you'd transfer 1 random resource card from victim to the robber's owner
    setPlayersToStealFrom([]);
    setIsMovingRobber(false);
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

    // Robber
    isMovingRobber,
    setIsMovingRobber,
    robberTileId,
    playersToStealFrom,
    stealFromPlayer,

    setSelectedTile: (tile) => setSelectedTile(tile),
    buildRoad,
    buildSettlement,
    moveRobber
  };

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
}
EOF

# 3) Update build_menu.jsx to add a note about robber control
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
    setIsBuildingSettlement(false);
    setIsBuildingRoad(!isBuildingRoad);
  };

  const toggleBuildSettlement = () => {
    if (!user) {
      alert('You must be logged in to build settlements!');
      return;
    }
    setIsBuildingRoad(false);
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

      <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#555' }}>
        Use the Robber Control to move the robber & steal.
      </p>
    </div>
  );
}
EOF

# 4) Update board_scene.jsx to place the robber on tile click if isMovingRobber is true
cat << 'EOF' > src/components/board_scene/board_scene.jsx
import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useGameState } from '../../hooks/use_game_state';
import './board_scene.css';

export default function BoardScene() {
  const {
    tiles, edges, vertices, roads, settlements,
    robberTileId
  } = useGameState();

  return (
    <div className="board-scene-container">
      <Canvas camera={{ position: [0, 0, 10] }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 10]} intensity={0.5} />

        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />

        {/* Tiles */}
        {tiles.map((tile) => (
          <HexTile key={tile.id} tile={tile} robberTileId={robberTileId} />
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

/** HexTile now also checks if isMovingRobber is active and places the robber on click */
function HexTile({ tile, robberTileId }) {
  const meshRef = useRef();
  const {
    setSelectedTile,
    isMovingRobber,
    moveRobber
  } = useGameState();

  const [hovered, setHovered] = useState(false);

  useFrame(() => {});

  const handleClick = () => {
    // If robber mode is active, place robber here
    if (isMovingRobber) {
      moveRobber(tile.id);
      return;
    }
    // Otherwise just select tile
    setSelectedTile(tile);
  };

  return (
    <group>
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

      {/* If robber is on this tile, show a robber marker */}
      {robberTileId === tile.id && (
        <RobberMarker position={tile.position} />
      )}
    </group>
  );
}

/** RobberMarker: a small black cylinder or other shape on top of the tile */
function RobberMarker({ position }) {
  const markerRef = useRef();

  useFrame(() => {
    if (markerRef.current) {
      // optional spin
      markerRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh position={[position[0], position[1], 0.2]} ref={markerRef}>
      <cylinderGeometry args={[0.3, 0.3, 0.4, 8]} />
      <meshStandardMaterial color="black" />
    </mesh>
  );
}

/** Edges for roads */
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
    buildRoad(edgeId, 'SomePlayer');
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

/** VertexMarker for settlements */
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

  useFrame(() => {});

  if (settlement) {
    return (
      <mesh ref={markerRef} position={vertex.position}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color={getPlayerColor(settlement.owner)} />
      </mesh>
    );
  }

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

/** Helpers for tile colors, etc. */
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

# 5) Update game_page.jsx to include RobberControl in the sidebar
cat << 'EOF' > src/components/game_page/game_page.jsx
import React, { useEffect } from 'react';
import { useGameState } from '../../hooks/use_game_state';
import BoardScene from '../board_scene/board_scene';
import ChatBox from '../chat_box/chat_box';
import BuildMenu from '../build_menu/build_menu';
import RobberControl from '../robber_control/robber_control';
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
      <p>Now includes a basic Robber mechanic!</p>

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
          <RobberControl />
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

# 6) Done
echo "Phase 8 files created/updated successfully!"
echo "Next steps:"
echo "1) Run 'npm start' -> /game -> click 'Move Robber', then click any tile."
echo "2) Robber will appear there (a small black cylinder)."
echo "3) If the tile has adjacent settlements, pick a player to 'steal' from."
echo "4) This is a simplified robber feature. Real logic: handle 7 rolls, dev cards, actual resource stealing, etc."