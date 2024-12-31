import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import OrbitControls from '../orbit_controls/orbit_controls.jsx';
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
