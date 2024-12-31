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
