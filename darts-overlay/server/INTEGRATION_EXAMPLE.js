/**
 * Integration Example: How to use WebSocket Dispatcher in server.js
 * This shows the pattern WITHOUT modifying the existing server yet
 */

const { dispatchMessage, broadcastEvents, handleRoomMessage } = require('./websocketDispatcher');

/**
 * Example: Incoming WebSocket message handler
 * This is how the dispatcher fits into your existing server
 *
 * Usage in server.js:
 *
 * ws.on('message', (rawMessage) => {
 *     try {
 *         const message = JSON.parse(rawMessage);
 *         const result = handleRoomMessage(
 *             rooms,
 *             roomId,
 *             message,
 *             roomClients
 *         );
 *
 *         if (!result.success) {
 *             ws.send(JSON.stringify({ type: 'error', data: result.error }));
 *             return;
 *         }
 *
 *         // State is already updated and broadcasted by handleRoomMessage
 *         console.log(`Room ${roomId} state updated by message:`, message.type);
 *     } catch (error) {
 *         console.error('Message handling error:', error);
 *         ws.send(JSON.stringify({ type: 'error', data: 'Failed to process message' }));
 *     }
 * });
 */

/**
 * Integration checklist:
 *
 * 1. Import dispatcher in server.js
 *    const { dispatchMessage, broadcastEvents, handleRoomMessage } = require('./websocketDispatcher');
 *
 * 2. Replace existing message handler with handleRoomMessage call
 *    - Remove: manual state updates from case statements
 *    - Add: handleRoomMessage for all game messages
 *
 * 3. Keep existing structure:
 *    - Room map (rooms.set/get)
 *    - Client tracking (roomClients map)
 *    - Static file serving
 *
 * 4. Testing:
 *    - npm test                 (run unit tests)
 *    - Start server manually
 *    - Smoke test: score input, bust, leg win, reset
 *    - Verify: Two browser windows sync correctly
 *
 * 5. Gradual migration:
 *    - Start with one message type (e.g., 'score')
 *    - Test thoroughly
 *    - Move to next type
 *    - Keep old code as fallback during transition
 */

module.exports = {
  // Export for documentation/examples
  integrationPattern: {
    dispatchMessage,
    broadcastEvents,
    handleRoomMessage,
  },
};
