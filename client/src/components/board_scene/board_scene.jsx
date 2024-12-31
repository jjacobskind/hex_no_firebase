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
