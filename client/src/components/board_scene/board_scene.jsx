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
