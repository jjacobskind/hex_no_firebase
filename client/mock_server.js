/**
 * Minimal mock backend server using Node + Socket.io.
 * Run: `node mock_server.js`
 * Then your React client can connect to ws://localhost:4000
 */
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const PORT = 4000;

// 1) Basic server setup
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',  // or specify your frontend origin
    methods: ['GET', 'POST']
  }
});

// 2) In-memory "game state" store
let gameState = {
  players: ['Alice', 'Bob'],
  tiles: [],
  edges: [],
  vertices: [],
  roads: [],
  settlements: [],
  playerResources: {},    // or your multi-resource objects
  playerVictoryPoints: {},
  currentPlayerIndex: 0,
  winner: null,
  robberTileId: null,
  diceResult: null,
  devDeck: [],
  playerDevCards: {},
  playersToStealFrom: [],
  pendingTrade: null,
  longestRoadOwner: null,
  longestRoadLength: 0,
  largestArmyOwner: null,
  largestArmySize: 0,
  playerKnightsPlayed: {}
};

// 3) Simple helper: broadcast updated state
function broadcastGameState() {
  io.emit('game-state-updated', gameState);
}

// 4) On client connection, send the current game state
io.on('connection', (socket) => {
  console.log('[Mock Server] Client connected:', socket.id);

  // Immediately send existing game state
  socket.emit('game-state-updated', gameState);

  // Listen for events your client emits (e.g. build-road, build-settlement, end-turn, etc.)

  socket.on('build-road', ({ edgeId, owner }) => {
    console.log(`[Mock Server] build-road from ${owner} on edge=${edgeId}`);
    // Minimal logic: just add a road to the in-memory array
    const existing = gameState.roads.find((r) => r.edgeId === edgeId);
    if (!existing) {
      gameState.roads.push({ edgeId, owner });
    }
    broadcastGameState();
  });

  socket.on('build-settlement', ({ vertexId, owner }) => {
    console.log(`[Mock Server] build-settlement from ${owner} on vertex=${vertexId}`);
    const existing = gameState.settlements.find((s) => s.vertexId === vertexId);
    if (!existing) {
      gameState.settlements.push({ vertexId, owner });
    }
    broadcastGameState();
  });

  socket.on('roll-dice', ({ playerName }) => {
    console.log(`[Mock Server] roll-dice by ${playerName}`);
    // Just pick a random dice total
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const total = die1 + die2;
    gameState.diceResult = total;
    console.log(`...mock dice = ${die1} + ${die2} = ${total}`);
    // For real logic, distribute resources, check robber, etc.
    broadcastGameState();
  });

  socket.on('end-turn', () => {
    console.log('[Mock Server] end-turn');
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    broadcastGameState();
  });

  socket.on('disconnect', () => {
    console.log('[Mock Server] Client disconnected:', socket.id);
  });
});

// 5) Basic route for debugging
app.get('/', (req, res) => {
  res.send('Mock backend is running...');
});

server.listen(PORT, () => {
  console.log(`[Mock Server] Listening on port ${PORT}`);
});