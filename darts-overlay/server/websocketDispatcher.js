/**
 * WebSocket Message Dispatcher
 * Central coordinator for incoming messages, state updates, and event broadcasts
 * Ties together gameLogic, messageHandlers, and room state management
 */

const {
  handleAddScore,
  handleSwitchPlayer,
  handleUpdatePlayerName,
  handleResetGame,
} = require('./messageHandlers');

/**
 * Process incoming WebSocket message
 * @param {Object} gameState - Current game state for the room
 * @param {Object} message - Incoming message { type, data, roomId }
 * @returns {Object} { gameState, events } where events are broadcast-ready
 */
function dispatchMessage(gameState, message) {
  if (!gameState || !message) {
    return { gameState, events: [{ type: 'error', data: 'Invalid message' }] };
  }

  const { type, data } = message;
  let result = { gameState, events: [] };

  switch (type) {
    case 'score': {
      if (!data || typeof data.value !== 'number') {
        return { gameState, events: [{ type: 'error', data: 'Invalid score value' }] };
      }
      result = handleAddScore(gameState, data.value);
      break;
    }

    case 'switchPlayer': {
      result = handleSwitchPlayer(gameState);
      break;
    }

    case 'updateName': {
      if (typeof data.playerIndex !== 'number' || typeof data.name !== 'string') {
        return { gameState, events: [{ type: 'error', data: 'Invalid name update' }] };
      }
      result = handleUpdatePlayerName(gameState, data.playerIndex, data.name);
      break;
    }

    case 'resetGame': {
      result = handleResetGame(gameState);
      break;
    }

    case 'ping': {
      // Echo for connection keep-alive
      result = { gameState, events: [{ type: 'pong', data: { timestamp: Date.now() } }] };
      break;
    }

    default: {
      result = { gameState, events: [{ type: 'error', data: `Unknown message type: ${type}` }] };
    }
  }

  return result;
}

/**
 * Broadcast events to all clients in a room
 * @param {Array} events - Array of { type, data }
 * @param {Map} roomClients - Map of client connections in room
 */
function broadcastEvents(events, roomClients) {
  if (!events || !Array.isArray(events)) {
    return;
  }

  events.forEach(event => {
    const message = JSON.stringify({
      type: 'stateUpdate',
      event: event.type,
      data: event.data,
      timestamp: Date.now(),
    });

    roomClients.forEach(client => {
      if (client && client.readyState === 1) {
        // OPEN
        client.send(message);
      }
    });
  });
}

/**
 * Process message and broadcast updates
 * @param {Map} rooms - Map of room states
 * @param {string} roomId - Room identifier
 * @param {Object} message - Incoming message
 * @param {Map} roomClients - Clients in this room
 * @returns {Object} { success, gameState, events }
 */
function handleRoomMessage(rooms, roomId, message, roomClients) {
  if (!rooms.has(roomId)) {
    return { success: false, error: 'Room not found' };
  }

  const currentState = rooms.get(roomId);
  const { gameState, events } = dispatchMessage(currentState, message);

  // Update room state
  rooms.set(roomId, gameState);

  // Broadcast to all clients
  broadcastEvents(events, roomClients);

  return { success: true, gameState, events };
}

module.exports = {
  dispatchMessage,
  broadcastEvents,
  handleRoomMessage,
};
