#!/usr/bin/env bash

#############################################
# PHASE 4 UPDATE SCRIPT
# Adds basic tile interactivity (hover/click)
# and OrbitControls for rotating the board.
#############################################

# 1) Update game_state_context.jsx to track selectedTile
cat << 'EOF' > src/context/game_state_context.jsx
import React, { createContext, useEffect, useState } from 'react';
import { useSocket } from '../hooks/use_socket';
import { getGameState, setGameState } from '../services/game_service';
import { generateHexBoard } from '../utils/board_utils';

export const GameStateContext = createContext(null);

/**
 * Provides a global game state + socket subscriptions.
 * Now includes selectedTile for UI interactions.
 */
export function GameStateProvider({ children }) {
  const [players, setPlayers] = useState([]);
  const [tiles, setTiles] = useState([]);
  const [selectedTile, setSelectedTile] = useState(null);

  const socket = useSocket(); // Connect to server

  // On mount: generate board if we haven't yet
  useEffect(() => {
    const existingGameState = getGameState();

    if (!existingGameState.tiles) {
      const newTiles = generateHexBoard();
      setGameState({ tiles: newTiles });
      setTiles(newTiles);
    } else {
      setTiles(existingGameState.tiles);
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
  }, [players, tiles]);

  // Update the service if we change selectedTile
  // (Optionally: store it in game_service if you want it persistent)
  function handleSelectTile(tile) {
    setSelectedTile(tile);
  }

  const contextValue = {
    players,
    setPlayers,
    tiles,
    setTiles,
    selectedTile,
    setSelectedTile: handleSelectTile,
  };

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
}
EOF

# 2) Update board_scene.jsx for pointer events & orbit controls
cat << 'EOF' > src/components/board_scene/board_scene.jsx
import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useGameState } from '../../hooks/use_game_state';
import './board_scene.css';

/**
 * The main 3D board scene. We add:
 * 1) OrbitControls for camera rotation/zoom.
 * 2) Tile interactivity (hover highlight, click to select).
 */
export default function BoardScene() {
  const { tiles } = useGameState();

  return (
    <div className="board-scene-container">
      <Canvas camera={{ position: [0, 0, 10] }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 10]} intensity={0.5} />

        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />

        {tiles.map((tile) => (
          <HexTile key={tile.id} tile={tile} />
        ))}
      </Canvas>
    </div>
  );
}

function HexTile({ tile }) {
  const meshRef = useRef();
  const { setSelectedTile } = useGameState();

  // Local hover state
  const [hovered, setHovered] = useState(false);

  // We'll do a slow rotation if you like, or comment out
  useFrame(() => {
    if (meshRef.current) {
      // meshRef.current.rotation.z += 0.0005;
    }
  });

  const handleClick = () => {
    // Let the context know which tile was clicked
    setSelectedTile(tile);
  };

  return (
    <mesh
      ref={meshRef}
      position={tile.position}
      onPointerOver={(e) => {
        e.stopPropagation(); // prevent event bubbling
        setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
      }}
      onClick={(e) => {
        e.stopPropagation();
        handleClick();
      }}
    >
      <cylinderGeometry args={[1, 1, 0.1, 6]} />
      <meshStandardMaterial color={getTileColor(tile, hovered)} />
    </mesh>
  );
}

function getTileColor(tile, hovered) {
  const base = getResourceColor(tile.resource);
  if (hovered) {
    // Lighten the base color or shift it
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

/**
 * Very naive "hover color" function that just brightens or modifies
 * the base color. For real usage, you might do better color math,
 * or just switch to a custom highlight color.
 */
function hoverColor(baseColor) {
  if (baseColor === 'brown') return '#a0522d';
  if (baseColor === 'green') return '#32cd32';
  if (baseColor === 'lightgreen') return '#90ee90';
  if (baseColor === 'gold') return '#ffd700';
  if (baseColor === 'gray') return '#b0b0b0';
  if (baseColor === 'sandybrown') return '#f4a460';
  return 'lightgray';
}
EOF

# 3) Update game_page.jsx to display the selectedTile
cat << 'EOF' > src/components/game_page/game_page.jsx
import React, { useEffect } from 'react';
import { useGameState } from '../../hooks/use_game_state';
import BoardScene from '../board_scene/board_scene';
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
      <p>Now tiles are interactive. Hover to highlight. Click to select!</p>

      <BoardScene />

      <div style={{ marginTop: 20 }}>
        <h3>Players in the game:</h3>
        <ul>
          {players.map((p, idx) => (
            <li key={idx}>{p}</li>
          ))}
        </ul>
      </div>

      {selectedTile && (
        <div style={{ marginTop: 20 }}>
          <h3>Selected Tile</h3>
          <p><strong>Resource:</strong> {selectedTile.resource}</p>
          <p><strong>Dice #:</strong> {selectedTile.diceNumber || 'None'}</p>
          <p><strong>Tile ID:</strong> {selectedTile.id}</p>
        </div>
      )}
    </div>
  );
}
EOF

echo "Phase 4 files created/updated successfully!"
echo "Next steps:"
echo "1) Run 'npm start' to see interactive hex tiles with hover/click."
echo "2) Use your mouse to orbit/zoom with OrbitControls."
echo "3) Check the 'Selected Tile' info on the page once you click a tile."
echo
echo "In future phases, we'll add building roads, robber logic, dev cards, trades, etc."