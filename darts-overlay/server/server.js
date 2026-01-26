const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

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

// Game state
let gameState = {
  players: [
    { name: 'Leikmaður 1', score: 501, legs: 0, sets: 0, isActive: true, dartsThrown: 0, totalScored: 0, average: 0 },
    { name: 'Leikmaður 2', score: 501, legs: 0, sets: 0, isActive: false, dartsThrown: 0, totalScored: 0, average: 0 }
  ],
  firstTo: 3,
  startScore: 501,
  history: [],
  gameOver: false,
  winner: null
};

let lastLegWinner = null;
let lastSetWinner = null;
let lastGameWinner = null;
let nextLegStartPlayer = 1; // Track who goes first in next leg (0 or 1), alternates each leg

function computeAverage(player) {
  if (!player || !player.dartsThrown) return 0;
  return (player.totalScored / player.dartsThrown) * 3;
}

function updatePlayerAverages() {
  gameState.players.forEach(p => {
    p.average = computeAverage(p);
  });
}

// Serve static files
const server = http.createServer((req, res) => {
  // Parse URL
  let filePath = req.url === '/' ? '/control/control.html' : req.url;
  
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
      '.svg': 'image/svg+xml'
    };

    const contentType = contentTypes[ext] || 'text/plain';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

// Create WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Broadcast state to all connected clients
function broadcast() {
  updatePlayerAverages();

  const stateWithCheckout = {
    ...gameState,
    checkoutSuggestion: getCheckoutSuggestion(gameState.players[gameState.players.findIndex(p => p.isActive)].score),
    legWin: lastLegWinner !== null,
    setWin: lastSetWinner !== null,
    gameWin: lastGameWinner !== null,
    legWinner: lastLegWinner,
    setWinner: lastSetWinner,
    gameWinner: lastGameWinner
  };
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'stateUpdate',
        data: stateWithCheckout
      }));
    }
  });
  
  // Reset win flags after broadcasting
  lastLegWinner = null;
  lastSetWinner = null;
  lastGameWinner = null;
}

// Get checkout suggestion for current score
function getCheckoutSuggestion(score) {
  if (score > 170 || score <= 0) return null;
  return checkoutsTable[score] || null;
}

// Validate score (no bust: score >= 0, no = 1)
function isValidScore(currentScore, deduction) {
  const newScore = currentScore - deduction;
  return newScore >= 0 && newScore !== 1;
}

// Handle player input
function addScore(playerIndex, scoreValue, dartCount = 3) {
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
      afterScore: player.score
    });
    switchPlayer();
    broadcast();
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
    lastLegWinner = playerIndex;
    gameState.history.push({
      timestamp: Date.now(),
      player: playerIndex,
      score: scoreValue,
      darts: dartCount,
      action: 'legWin',
      beforeScore: player.score + scoreValue,
      afterScore: 0
    });

    // Check if match is won (legs >= firstTo)
    if (player.legs >= gameState.firstTo) {
      gameState.gameOver = true;
      gameState.winner = playerIndex;
      lastGameWinner = playerIndex;
      broadcast();
      return { success: true, legWin: true, gameWin: true };
    }

    // Leg won but match not won yet
    // Loser of leg starts next leg
    switchPlayerAfterLegWin(playerIndex);
    
    // Reset scores for next leg
    gameState.players.forEach(p => p.score = gameState.startScore || 501);
    
    broadcast();
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
    afterScore: player.score
  });

  switchPlayer();
  broadcast();
  return { success: true, legWin: false };
}

function addBust(playerIndex, dartCount = 3) {
  const player = gameState.players[playerIndex];
  player.dartsThrown += dartCount;

  gameState.history.push({
    timestamp: Date.now(),
    player: playerIndex,
    score: 0,
    darts: dartCount,
    action: 'bust',
    beforeScore: player.score,
    afterScore: player.score
  });

  switchPlayer();
  broadcast();
  return { success: true, bust: true };
}

// Switch active player
function switchPlayer() {
  const activeIndex = gameState.players.findIndex(p => p.isActive);
  gameState.players[activeIndex].isActive = false;
  gameState.players[1 - activeIndex].isActive = true;
}

// Determine who goes first in next leg (alternates between players)
function switchPlayerAfterLegWin(legWinnerIndex) {
  gameState.players[0].isActive = (nextLegStartPlayer === 0);
  gameState.players[1].isActive = (nextLegStartPlayer === 1);
  // Alternate for next leg
  nextLegStartPlayer = 1 - nextLegStartPlayer;
}

// Undo last action
function undo() {
  if (gameState.history.length === 0) {
    console.log('No history to undo');
    return { success: false };
  }

  const lastAction = gameState.history.pop();
  console.log('Undoing action:', JSON.stringify(lastAction, null, 2));
  
  const player = gameState.players[lastAction.player];
  
  // Restore score
  player.score = lastAction.beforeScore;
  console.log(`Player ${lastAction.player} score restored from ${lastAction.afterScore} to ${player.score}`);

  // Revert darts thrown
  if (lastAction.darts) {
    const oldDarts = player.dartsThrown;
    player.dartsThrown = Math.max(0, player.dartsThrown - lastAction.darts);
    console.log(`Player ${lastAction.player} darts: ${oldDarts} - ${lastAction.darts} = ${player.dartsThrown}`);
  }
  
  // Revert total scored (but not for bust since no score was added)
  if (lastAction.action !== 'bust' && lastAction.score) {
    const oldTotal = player.totalScored;
    player.totalScored = Math.max(0, player.totalScored - lastAction.score);
    console.log(`Player ${lastAction.player} totalScored: ${oldTotal} - ${lastAction.score} = ${player.totalScored}`);
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

  broadcast();
  return { success: true };
}

// Reset game
function resetGame() {
  const startScore = gameState.startScore || 501;
  gameState = {
    players: [
      { name: gameState.players[0].name, score: startScore, legs: 0, sets: 0, isActive: true, dartsThrown: 0, totalScored: 0, average: 0 },
      { name: gameState.players[1].name, score: startScore, legs: 0, sets: 0, isActive: false, dartsThrown: 0, totalScored: 0, average: 0 }
    ],
    firstTo: gameState.firstTo,
    startScore: startScore,
    history: [],
    gameOver: false,
    winner: null
  };
  nextLegStartPlayer = 1; // Reset so player 2 starts leg 2 after player 1 starts leg 1
  broadcast();
  return { success: true };
}

// Update player name
function updatePlayerName(playerIndex, newName) {
  if (playerIndex >= 0 && playerIndex < 2) {
    gameState.players[playerIndex].name = newName;
    broadcast();
    return { success: true };
  }
  return { success: false };
}

// Update first-to value (only if game is not in progress)
function updateFirstTo(value) {
  const val = parseInt(value);
  
  // Only allow changes if no legs have been played yet (fresh game)
  if (gameState.players[0].legs > 0 || gameState.players[1].legs > 0) {
    // Game in progress, don't allow changes
    return { success: false, reason: 'Game in progress' };
  }
  
  if (val > 0 && val <= 20) {
    gameState.firstTo = val;
    broadcast();
    return { success: true };
  }
  return { success: false };
}

// Update game type (501 vs 301)
function updateGameType(gameType) {
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
    broadcast();
    return { success: true };
  }
  return { success: false };
}

// WebSocket message handling
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send initial state
  ws.send(JSON.stringify({
    type: 'stateUpdate',
    data: {
      ...gameState,
      checkoutSuggestion: getCheckoutSuggestion(gameState.players[gameState.players.findIndex(p => p.isActive)].score)
    }
  }));

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('Message received:', message.type, message);

      switch (message.type) {
        case 'score':
          console.log('Processing score:', message.playerIndex, message.value, 'darts:', message.darts);
          addScore(
            message.playerIndex !== undefined ? message.playerIndex : gameState.players.findIndex(p => p.isActive),
            message.value,
            message.darts || 3
          );
          break;

        case 'bust':
          addBust(
            message.playerIndex !== undefined ? message.playerIndex : gameState.players.findIndex(p => p.isActive),
            message.darts || 3
          );
          break;

        case 'switchPlayer':
          switchPlayer();
          broadcast();
          break;

        case 'undo':
          undo();
          break;

        case 'resetGame':
          resetGame();
          break;

        case 'updateName':
          updatePlayerName(message.playerIndex, message.name);
          break;

        case 'updateFirstTo':
          updateFirstTo(message.value);
          break;

        case 'updateGameType':
          updateGameType(message.gameType);
          break;

        case 'getState':
          ws.send(JSON.stringify({
            type: 'stateUpdate',
            data: {
              ...gameState,
              checkoutSuggestion: getCheckoutSuggestion(gameState.players[gameState.players.findIndex(p => p.isActive)].score)
            }
          }));
          break;

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

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Handle HTTP upgrade for WebSocket
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const localhost = `ws://127.0.0.1:${PORT}`;
  const network = `ws://0.0.0.0:${PORT}`;
  console.log(`Darts Overlay Server running`);
  console.log(`  Local:    ${localhost}`);
  console.log(`  Network:  ${network}`);
  console.log('Press Ctrl+C to stop');
});
