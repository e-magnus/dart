/**
 * Client State Management
 * Handles game state and WebSocket communication for control panel
 */

let currentRoomId = null;
let gameState = null;
let ws = null;

const initialGameState = {
  players: [
    {
      name: 'Leikmaður 1',
      score: 501,
      legs: 0,
      sets: 0,
      isActive: true,
      dartsThrown: 0,
      totalScored: 0,
      average: 0,
    },
    {
      name: 'Leikmaður 2',
      score: 501,
      legs: 0,
      sets: 0,
      isActive: false,
      dartsThrown: 0,
      totalScored: 0,
      average: 0,
    },
  ],
  firstTo: 3,
  startScore: 501,
  gameOver: false,
  winner: null,
};

function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function loadRoomIdFromStorage() {
  return localStorage.getItem('darts_roomId');
}

function saveRoomIdToStorage(roomId) {
  localStorage.setItem('darts_roomId', roomId);
}

function clearRoomIdFromStorage() {
  localStorage.removeItem('darts_roomId');
}

function getWebSocketURL() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host || 'localhost:8080';
  if (window.location.protocol === 'file:') {
    return 'ws://localhost:8080';
  }
  return `${protocol}//${host}`;
}

function initializeState() {
  if (!currentRoomId) {
    // Try to load room ID from localStorage
    currentRoomId = loadRoomIdFromStorage();
    if (!currentRoomId) {
      // Only generate new room ID if none exists in storage
      currentRoomId = generateRoomId();
    }
    // Save room ID to localStorage
    saveRoomIdToStorage(currentRoomId);
  }
  gameState = JSON.parse(JSON.stringify(initialGameState));
  return { roomId: currentRoomId, state: gameState };
}

function updateGameState(newState) {
  gameState = newState;
  return gameState;
}

function resetGameState() {
  gameState = JSON.parse(JSON.stringify(initialGameState));
  return gameState;
}

function getGameState() {
  return gameState;
}

function getRoomId() {
  return currentRoomId;
}

function setWebSocket(wsConnection) {
  ws = wsConnection;
}

function getWebSocket() {
  return ws;
}

function isWebSocketConnected() {
  return ws && ws.readyState === WebSocket.OPEN;
}

module.exports = {
  generateRoomId,
  getWebSocketURL,
  initializeState,
  updateGameState,
  resetGameState,
  getGameState,
  getRoomId,
  setWebSocket,
  getWebSocket,
  isWebSocketConnected,
};
