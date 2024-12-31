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
