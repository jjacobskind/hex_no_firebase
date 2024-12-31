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
