const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const messageHandlers = require('./messageHandlers');

const PORT = 8080;

// Load checkouts table
let checkoutsTable = {};
try {
  const checkoutsPath = path.join(__dirname, 'checkouts.json');
  const checkoutsData = fs.readFileSync(checkoutsPath, 'utf8');
  checkoutsTable = JSON.parse(checkoutsData);
} catch (e) {
  console.error('Failed to load checkouts.json:', e.message);
  checkoutsTable = {};
}

// Game state - now organized by room
const rooms = new Map();

// Create default initial game state
function createInitialGameState(playerCount = 2) {
  const players = [];
  for (let i = 0; i < playerCount; i++) {
    players.push({
      name: `Leikmaður ${i + 1}`,
      score: 501,
      legs: 0,
      sets: 0,
      isActive: i === 0, // First player is active
      dartsThrown: 0,
      totalScored: 0,
      average: 0,
    });
  }

  return {
    players,
    playerCount,
    firstTo: 3,
    startScore: 501,
    history: [],
    gameOver: false,
    winner: null,
    lastLegWinner: null,
    lastSetWinner: null,
    lastGameWinner: null,
    nextLegStartPlayer: playerCount > 1 ? 1 : 0, // Track who goes first in next leg, rotates each leg
    bullUpPhase: false, // Are we in bull-up phase to determine order?
    bullUpScores: [], // Bull-up throws: [{playerIndex, score}]
  };
}

// Get or create room
function getOrCreateRoom(roomId) {
  if (!roomId || roomId === 'undefined') {
    roomId = 'default';
  }

  if (!rooms.has(roomId)) {
    rooms.set(roomId, createInitialGameState());
    console.log(`Created new room: ${roomId}`);
  }

  return rooms.get(roomId);
}

function computeAverage(player) {
  if (!player || !player.dartsThrown) {
    return 0;
  }
  return (player.totalScored / player.dartsThrown) * 3;
}

function updatePlayerAverages(gameState) {
  gameState.players.forEach(p => {
    p.average = computeAverage(p);
  });
}

// Serve static files
const server = http.createServer((req, res) => {
  // Parse URL and remove query string
  let filePath = req.url.split('?')[0]; // Remove query string
  filePath = filePath === '/' ? '/control/control.html' : filePath;

  // Security: prevent directory traversal
  if (filePath.includes('..')) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden\n');
    return;
  }

  // Map URL to file path
  filePath = path.join(__dirname, '..', filePath);

  // Read and serve file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found\n');
      return;
    }

    // Determine content type
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
    };

    const contentType = contentTypes[ext] || 'text/plain';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

// Create WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Broadcast state to all connected clients in the same room
function broadcast(roomId) {
  const gameState = getOrCreateRoom(roomId);
  updatePlayerAverages(gameState);

  const activeIndex = gameState.players.findIndex(p => p.isActive);
  const activePlayer = activeIndex >= 0 ? gameState.players[activeIndex] : null;

  const stateWithCheckout = {
    ...gameState,
    checkoutSuggestion: activePlayer ? getCheckoutSuggestion(activePlayer.score) : null,
    legWin: gameState.lastLegWinner !== null,
    setWin: gameState.lastSetWinner !== null,
    gameWin: gameState.lastGameWinner !== null,
    legWinner: gameState.lastLegWinner,
    setWinner: gameState.lastSetWinner,
    gameWinner: gameState.lastGameWinner,
  };

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.roomId === roomId) {
      client.send(
        JSON.stringify({
          type: 'stateUpdate',
          data: stateWithCheckout,
        })
      );
    }
  });

  // Reset win flags after broadcasting
  gameState.lastLegWinner = null;
  gameState.lastSetWinner = null;
  gameState.lastGameWinner = null;
}

function broadcastEvents(roomId, events) {
  if (!events || events.length === 0) {
    return;
  }

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.roomId === roomId) {
      events.forEach(event => {
        client.send(
          JSON.stringify({
            type: 'event',
            data: event,
          })
        );
      });
    }
  });
}

// Get checkout suggestion for current score
function getCheckoutSuggestion(score) {
  if (score > 170 || score <= 0) {
    return null;
  }
  return checkoutsTable[score] || null;
}

// Validate score (no bust: score >= 0, no = 1)
function isValidScore(currentScore, deduction) {
  const newScore = currentScore - deduction;
  return newScore >= 0 && newScore !== 1;
}

// Handle player input
function addScore(roomId, playerIndex, scoreValue, dartCount = 3) {
  const gameState = getOrCreateRoom(roomId);
  const player = gameState.players[playerIndex];
  const newScore = player.score - scoreValue;

  // Bust detection
  if (newScore < 0 || newScore === 1) {
    // Bust - score stays same, switch player
    player.dartsThrown += dartCount;
    gameState.history.push({
      timestamp: Date.now(),
      player: playerIndex,
      score: scoreValue,
      darts: dartCount,
      action: 'bust',
      beforeScore: player.score,
      afterScore: player.score,
    });
    switchPlayer(gameState);
    broadcast(roomId);
    return { success: false, reason: 'bust' };
  }

  // Check for leg win (exact checkout)
  if (newScore === 0) {
    // In darts, you MUST finish with a DOUBLE
    // Only validate if the last dart in the round must be double
    // For now, we'll check this in control.js client-side

    player.score = newScore;
    player.legs++;
    player.totalScored += scoreValue;
    player.dartsThrown += dartCount;
    gameState.lastLegWinner = playerIndex;
    gameState.history.push({
      timestamp: Date.now(),
      player: playerIndex,
      score: scoreValue,
      darts: dartCount,
      action: 'legWin',
      beforeScore: player.score + scoreValue,
      afterScore: 0,
    });

    // Check if match is won (legs >= firstTo)
    if (player.legs >= gameState.firstTo) {
      gameState.gameOver = true;
      gameState.winner = playerIndex;
      gameState.lastGameWinner = playerIndex;
      broadcast(roomId);
      return { success: true, legWin: true, gameWin: true };
    }

    // Leg won but match not won yet
    // Loser of leg starts next leg
    switchPlayerAfterLegWin(gameState, playerIndex);

    // Reset scores for next leg
    gameState.players.forEach(p => (p.score = gameState.startScore || 501));

    broadcast(roomId);
    return { success: true, legWin: true, gameWin: false };
  }

  // Regular score (not a bust, not a leg win)
  player.score = newScore;
  player.totalScored += scoreValue;
  player.dartsThrown += dartCount;
  gameState.history.push({
    timestamp: Date.now(),
    player: playerIndex,
    score: scoreValue,
    darts: dartCount,
    action: 'score',
    beforeScore: player.score + scoreValue,
    afterScore: player.score,
  });

  switchPlayer(gameState);
  broadcast(roomId);
  return { success: true, legWin: false };
}

function addBust(roomId, playerIndex, dartCount = 3) {
  const gameState = getOrCreateRoom(roomId);
  const player = gameState.players[playerIndex];
  player.dartsThrown += dartCount;

  gameState.history.push({
    timestamp: Date.now(),
    player: playerIndex,
    score: 0,
    darts: dartCount,
    action: 'bust',
    beforeScore: player.score,
    afterScore: player.score,
  });

  switchPlayer(gameState);
  broadcast(roomId);
  return { success: true, bust: true };
}

// Switch active player
function switchPlayer(gameState) {
  const playerCount = gameState.players.length;
  if (playerCount === 0) {
    return;
  }

  const activeIndex = gameState.players.findIndex(p => p.isActive);
  if (activeIndex !== -1) {
    gameState.players[activeIndex].isActive = false;
  }

  const nextIndex = activeIndex === -1 ? 0 : (activeIndex + 1) % playerCount;
  gameState.players[nextIndex].isActive = true;
}

// Determine who goes first in next leg (alternates between players)
function switchPlayerAfterLegWin(gameState, legWinnerIndex) {
  const playerCount = gameState.players.length;
  if (playerCount === 0) {
    return;
  }

  const currentStart = Number.isInteger(gameState.nextLegStartPlayer)
    ? gameState.nextLegStartPlayer
    : 0;
  const startIndex = ((currentStart % playerCount) + playerCount) % playerCount;

  gameState.players.forEach((player, index) => {
    player.isActive = index === startIndex;
  });

  // Rotate for next leg
  gameState.nextLegStartPlayer = (startIndex + 1) % playerCount;
}

// Undo last action
function undo(roomId) {
  const gameState = getOrCreateRoom(roomId);

  if (gameState.history.length === 0) {
    console.log('No history to undo');
    return { success: false };
  }

  const lastAction = gameState.history.pop();
  console.log('Undoing action:', JSON.stringify(lastAction, null, 2));

  const player = gameState.players[lastAction.player];

  // Restore score
  player.score = lastAction.beforeScore;
  console.log(
    `Player ${lastAction.player} score restored from ${lastAction.afterScore} to ${player.score}`
  );

  // Revert darts thrown
  if (lastAction.darts) {
    const oldDarts = player.dartsThrown;
    player.dartsThrown = Math.max(0, player.dartsThrown - lastAction.darts);
    console.log(
      `Player ${lastAction.player} darts: ${oldDarts} - ${lastAction.darts} = ${player.dartsThrown}`
    );
  }

  // Revert total scored (but not for bust since no score was added)
  if (lastAction.action !== 'bust' && lastAction.score) {
    const oldTotal = player.totalScored;
    player.totalScored = Math.max(0, player.totalScored - lastAction.score);
    console.log(
      `Player ${lastAction.player} totalScored: ${oldTotal} - ${lastAction.score} = ${player.totalScored}`
    );
  }

  // Handle leg win undo
  if (lastAction.action === 'legWin') {
    player.legs = Math.max(0, player.legs - 1);
    gameState.gameOver = false;
    gameState.winner = null;
    console.log(`Leg win undone, player ${lastAction.player} legs now: ${player.legs}`);
  }

  // Restore active player state
  const activeIndex = gameState.players.findIndex(p => p.isActive);
  gameState.players[activeIndex].isActive = false;
  gameState.players[lastAction.player].isActive = true;
  console.log(`Active player switched from ${activeIndex} to ${lastAction.player}`);

  broadcast(roomId);
  return { success: true };
}

// Reset game
function resetGame(roomId, playerCount = null) {
  const gameState = getOrCreateRoom(roomId);
  const desiredPlayerCount = Math.max(
    1,
    Math.min(4, Number(playerCount) || gameState.players.length)
  );

  // If player count changes, rebuild state with correct number of players
  if (desiredPlayerCount !== gameState.players.length) {
    const newState = createInitialGameState(desiredPlayerCount);
    newState.firstTo = gameState.firstTo || 3;
    newState.startScore = gameState.startScore || 501;
    rooms.set(roomId, newState);
    broadcast(roomId);
    return { success: true };
  }

  const startScore = gameState.startScore || 501;

  // Create players array dynamically based on current player count
  const players = [];
  for (let i = 0; i < gameState.players.length; i++) {
    players.push({
      name: gameState.players[i].name,
      score: startScore,
      legs: 0,
      sets: 0,
      isActive: i === 0,
      dartsThrown: 0,
      totalScored: 0,
      average: 0,
    });
  }

  const newState = {
    players: players,
    playerCount: gameState.players.length,
    firstTo: gameState.firstTo,
    startScore: startScore,
    history: [],
    gameOver: false,
    winner: null,
    lastLegWinner: null,
    lastSetWinner: null,
    lastGameWinner: null,
    nextLegStartPlayer: players.length > 1 ? 1 : 0, // Reset so next player starts leg 2 after player 0 starts leg 1
    bullUpPhase: false,
    bullUpScores: [],
  };

  rooms.set(roomId, newState);
  broadcast(roomId);
  return { success: true };
}

// Update player name
function updatePlayerName(roomId, playerIndex, newName) {
  const gameState = getOrCreateRoom(roomId);

  if (playerIndex >= 0 && playerIndex < gameState.players.length) {
    gameState.players[playerIndex].name = newName;
    broadcast(roomId);
    return { success: true };
  }
  return { success: false };
}

// Update first-to value (only if game is not in progress)
function updateFirstTo(roomId, value) {
  const gameState = getOrCreateRoom(roomId);
  const val = parseInt(value);

  // Only allow changes if no legs have been played yet (fresh game)
  if (gameState.players.some(player => player.legs > 0)) {
    // Game in progress, don't allow changes
    return { success: false, reason: 'Game in progress' };
  }

  if (val > 0 && val <= 20) {
    gameState.firstTo = val;
    broadcast(roomId);
    return { success: true };
  }
  return { success: false };
}

// Update game type (501 vs 301)
function updateGameType(roomId, gameType) {
  const gameState = getOrCreateRoom(roomId);
  const type = parseInt(gameType);

  if (type === 301 || type === 501) {
    gameState.startScore = type;
    gameState.players.forEach(p => {
      p.score = type;
      p.dartsThrown = 0;
      p.totalScored = 0;
      p.average = 0;
      p.legs = 0;
    });
    gameState.history = [];
    broadcast(roomId);
    return { success: true };
  }
  return { success: false };
}

// WebSocket message handling
wss.on('connection', ws => {
  console.log('Client connected');

  ws.on('message', data => {
    try {
      const message = JSON.parse(data);
      const roomId = message.roomId || 'default';

      // Store room ID with WebSocket connection
      ws.roomId = roomId;

      console.log(`Message received in room ${roomId}:`, message.type);

      switch (message.type) {
        case 'join': {
          // Client is joining a room - send initial state
          const gameState = getOrCreateRoom(roomId);
          ws.send(
            JSON.stringify({
              type: 'stateUpdate',
              data: {
                ...gameState,
                checkoutSuggestion: getCheckoutSuggestion(
                  gameState.players[gameState.players.findIndex(p => p.isActive)].score
                ),
              },
            })
          );
          break;
        }

        case 'score':
          console.log(
            'Processing score:',
            message.playerIndex,
            message.value,
            'darts:',
            message.darts
          );
          addScore(
            roomId,
            message.playerIndex !== undefined
              ? message.playerIndex
              : getOrCreateRoom(roomId).players.findIndex(p => p.isActive),
            message.value,
            message.darts || 3
          );
          break;

        case 'bust':
          addBust(
            roomId,
            message.playerIndex !== undefined
              ? message.playerIndex
              : getOrCreateRoom(roomId).players.findIndex(p => p.isActive),
            message.darts || 3
          );
          break;

        case 'switchPlayer':
          switchPlayer(getOrCreateRoom(roomId));
          broadcast(roomId);
          break;

        case 'undo':
          undo(roomId);
          break;

        case 'resetGame':
          resetGame(roomId, message.playerCount);
          break;

        case 'updateName':
          updatePlayerName(roomId, message.playerIndex, message.name);
          break;

        case 'updateFirstTo':
          updateFirstTo(roomId, message.value);
          break;

        case 'updateGameType':
          updateGameType(roomId, message.gameType);
          break;

        case 'startBullUp': {
          const currentState = getOrCreateRoom(roomId);
          const { newState, events } = messageHandlers.handleStartBullUp(currentState);
          rooms.set(roomId, newState);
          broadcastEvents(roomId, events);
          broadcast(roomId);
          break;
        }

        case 'bullUpThrow': {
          const currentState = getOrCreateRoom(roomId);
          const { newState, events } = messageHandlers.handleBullUpThrow(
            currentState,
            message.playerIndex,
            message.score
          );
          rooms.set(roomId, newState);
          broadcastEvents(roomId, events);
          broadcast(roomId);
          break;
        }

        case 'getState': {
          const state = getOrCreateRoom(roomId);
          const activeIndex = state.players.findIndex(p => p.isActive);
          const activePlayer = activeIndex >= 0 ? state.players[activeIndex] : null;
          ws.send(
            JSON.stringify({
              type: 'stateUpdate',
              data: {
                ...state,
                checkoutSuggestion: activePlayer ? getCheckoutSuggestion(activePlayer.score) : null,
              },
            })
          );
          break;
        }

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (e) {
      console.error('Message handling error:', e);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', error => {
    console.error('WebSocket error:', error);
  });
});

// Handle HTTP upgrade for WebSocket
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, ws => {
    wss.emit('connection', ws, request);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const localhost = `ws://127.0.0.1:${PORT}`;
  const network = `ws://0.0.0.0:${PORT}`;
  console.log('Darts Overlay Server running');
  console.log(`  Local:    ${localhost}`);
  console.log(`  Network:  ${network}`);
  console.log('Press Ctrl+C to stop');
});
