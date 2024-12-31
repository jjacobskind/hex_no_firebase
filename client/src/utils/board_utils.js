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
