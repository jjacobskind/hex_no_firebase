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
