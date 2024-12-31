#!/usr/bin/env bash

#############################################
# PHASE 3 UPDATE SCRIPT
# Adds a basic 3D board (react-three-fiber)
#############################################

# 1) Update board_utils.js with a function to generate a simple hex layout
cat << 'EOF' > src/utils/board_utils.js
/**
 * board_utils.js
 * Helper functions for generating or manipulating the hex board layout.
 *
 * For a standard Catan board, we typically have 19 hex tiles:
 * (3-4-5-4-3 layout). Each has:
 *   - resource type: e.g. 'brick', 'wood', 'sheep', 'wheat', 'ore', 'desert'
 *   - dice number: e.g. 2..12 (excluding 7), assigned randomly in a real game
 *   - position: x, y, possibly z for 3D offsets
 */

const DEFAULT_RESOURCES = ['brick', 'wood', 'sheep', 'wheat', 'ore', 'desert'];

/**
 * generateHexBoard()
 * Returns an array of tile objects that you can render in BoardScene.
 * You can randomize resources & dice numbers for a real game.
 */
export function generateHexBoard() {
  // Basic coords for a standard layout: 3-4-5-4-3
  // This is a simplistic approach. Adapt as needed.
  const layout = [
    { rowLength: 3, yOffset: -2 },
    { rowLength: 4, yOffset: -1 },
    { rowLength: 5, yOffset: 0 },
    { rowLength: 4, yOffset: 1 },
    { rowLength: 3, yOffset: 2 },
  ];

  // Example dice numbers (excluding 7):
  const diceNumbers = [2,3,4,5,6,8,9,10,11,12];

  let tiles = [];
  let tileId = 1;

  for (let row = 0; row < layout.length; row++) {
    const { rowLength, yOffset } = layout[row];

    for (let col = 0; col < rowLength; col++) {
      // Resource distribution is random for now
      const resource = DEFAULT_RESOURCES[Math.floor(Math.random() * DEFAULT_RESOURCES.length)];

      // Random diceNumber (or desert= no number)
      let diceNumber = null;
      if (resource !== 'desert') {
        diceNumber = diceNumbers[Math.floor(Math.random() * diceNumbers.length)];
      }

      // Position the hex:
      // We'll do a simplistic hex spacing. Each hex is ~1.8 wide in x
      // yOffset shifts rows up/down. We also shift x to center the row horizontally.
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
EOF

# 2) Create/Update the new board_scene folder & files
mkdir -p src/components/board_scene

# board_scene.jsx (main 3D scene)
cat << 'EOF' > src/components/board_scene/board_scene.jsx
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGameState } from '../../hooks/use_game_state';
import './board_scene.css';

/**
 * The main 3D board scene. Displays hex tiles from the game state,
 * using react-three-fiber. In future phases, we'll add:
 *  - clickable tiles
 *  - roads, settlements
 *  - camera controls, etc.
 */

export default function BoardScene() {
  const { tiles } = useGameState();

  return (
    <div className="board-scene-container">
      <Canvas camera={{ position: [0, 0, 10] }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 10]} intensity={0.5} />
        {/* Render each tile as a hex mesh */}
        {tiles.map((tile) => (
          <HexTile key={tile.id} tile={tile} />
        ))}
      </Canvas>
    </div>
  );
}

/**
 * A single hex tile
 */
function HexTile({ tile }) {
  const meshRef = useRef();

  // Simple spin for demonstration
  // Remove or modify once we add real interactions
  useFrame(() => {
    if (meshRef.current) {
      // meshRef.current.rotation.z += 0.001; // slow spin
    }
  });

  return (
    <mesh ref={meshRef} position={tile.position}>
      {/* approximate a hex shape via cylinderGeometry with minimal height */}
      <cylinderGeometry args={[1, 1, 0.1, 6]} />
      <meshStandardMaterial color={getResourceColor(tile.resource)} />
    </mesh>
  );
}

/**
 * Assign each resource a color, for demonstration.
 * In a real game, you'd map to a tile texture or more advanced material.
 */
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
EOF

# board_scene.css (optional)
cat << 'EOF' > src/components/board_scene/board_scene.css
.board-scene-container {
  width: 100%;
  height: 600px; /* Adjust as needed */
  background-color: #111;
}
EOF

# index.js for board_scene
cat << 'EOF' > src/components/board_scene/index.js
export { default } from './board_scene.jsx';
EOF

# 3) Update the GameStateContext to load tiles
cat << 'EOF' > src/context/game_state_context.jsx
import React, { createContext, useEffect, useState } from 'react';
import { useSocket } from '../hooks/use_socket';
import { getGameState, setGameState } from '../services/game_service';
import { generateHexBoard } from '../utils/board_utils';

export const GameStateContext = createContext(null);

/**
 * Provides a global game state + socket subscriptions.
 * In Phase 3, we also generate hex tiles upon mount and store in context.
 */
export function GameStateProvider({ children }) {
  const [players, setPlayers] = useState([]);
  const [tiles, setTiles] = useState([]);
  const socket = useSocket(); // Connect to server

  // On mount: generate board if we haven't yet
  useEffect(() => {
    const existingGameState = getGameState();

    // If no tiles in the game state, generate them
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

  // Update local states if game_service changes
  // (In a bigger app, we might unify this in Redux or a single source of truth)
  useEffect(() => {
    const gs = getGameState();
    if (gs.players && gs.players !== players) {
      setPlayers(gs.players);
    }
    if (gs.tiles && gs.tiles !== tiles) {
      setTiles(gs.tiles);
    }
  }, [players, tiles]);

  const contextValue = {
    players,
    setPlayers,
    tiles,
    setTiles,
  };

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
}
EOF

# 4) Update game_page.jsx to display the new BoardScene
cat << 'EOF' > src/components/game_page/game_page.jsx
import React, { useEffect } from 'react';
import { useGameState } from '../../hooks/use_game_state';
import BoardScene from '../board_scene/board_scene';
import './game_page.css';

export default function GamePage() {
  const { players } = useGameState();

  // Log whenever players change
  useEffect(() => {
    console.log('[GamePage] players updated:', players);
  }, [players]);

  return (
    <div className="game-page">
      <h2>Hex Island</h2>
      <p>This 3D board is now rendered via react-three-fiber:</p>

      {/* Our new 3D board */}
      <BoardScene />

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

echo "Phase 3 files created/updated successfully!"
echo "Next steps:"
echo "1) npm start, then navigate to /game."
echo "2) You'll see a static 3D grid of hex tiles in random resources."
echo "3) Check the console for logs. The board is still non-interactive."
echo "4) Future phases: roads, robber, dev cards, trades, etc."