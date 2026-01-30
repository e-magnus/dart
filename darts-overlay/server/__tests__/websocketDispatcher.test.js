/**
 * WebSocket Dispatcher Tests
 * Tests the message routing and state update flow
 */

const { dispatchMessage, broadcastEvents, handleRoomMessage } = require('../websocketDispatcher');

const { createInitialGameState } = require('../gameLogic');

describe('WebSocket Dispatcher', () => {
  let initialState;

  beforeEach(() => {
    initialState = createInitialGameState();
  });

  describe('dispatchMessage - Core Routing', () => {
    it('should handle score message', () => {
      const message = { type: 'score', data: { value: 20 } };
      const { gameState, events } = dispatchMessage(initialState, message);

      expect(gameState.players[0].score).toBe(481);
      expect(events[0].type).toBe('score_added');
    });

    it('should handle switchPlayer message', () => {
      const message = { type: 'switchPlayer' };
      const { gameState, events } = dispatchMessage(initialState, message);

      expect(gameState.players[0].isActive).toBe(false);
      expect(gameState.players[1].isActive).toBe(true);
      expect(events[0].type).toBe('player_switched');
    });

    it('should handle updateName message', () => {
      const message = { type: 'updateName', data: { playerIndex: 0, name: 'Alice' } };
      const { gameState, events } = dispatchMessage(initialState, message);

      expect(gameState.players[0].name).toBe('Alice');
      expect(events[0].type).toBe('name_updated');
    });

    it('should handle resetGame message', () => {
      const state = {
        ...initialState,
        players: [{ ...initialState.players[0], score: 100, legs: 2 }, initialState.players[1]],
      };
      const message = { type: 'resetGame' };
      const { gameState, events } = dispatchMessage(state, message);

      expect(gameState.players[0].score).toBe(501);
      expect(gameState.players[0].legs).toBe(0);
      expect(events[0].type).toBe('game_reset');
    });

    it('should handle ping with pong response', () => {
      const message = { type: 'ping' };
      const { events } = dispatchMessage(initialState, message);

      expect(events[0].type).toBe('pong');
      expect(events[0].data.timestamp).toBeDefined();
    });

    it('should reject unknown message type', () => {
      const message = { type: 'unknown' };
      const { events } = dispatchMessage(initialState, message);

      expect(events[0].type).toBe('error');
      expect(events[0].data).toContain('Unknown message type');
    });

    it('should reject malformed score message', () => {
      const message = { type: 'score', data: { value: 'notanumber' } };
      const { events } = dispatchMessage(initialState, message);

      expect(events[0].type).toBe('error');
    });

    it('should reject null message', () => {
      const { events } = dispatchMessage(initialState, null);
      expect(events[0].type).toBe('error');
    });
  });

  describe('dispatchMessage - Game Flow Scenarios', () => {
    it('should handle complete leg win sequence', () => {
      const state = {
        ...initialState,
        players: [{ ...initialState.players[0], score: 50 }, initialState.players[1]],
      };

      const msg1 = { type: 'score', data: { value: 50 } };
      const result1 = dispatchMessage(state, msg1);

      expect(result1.gameState.players[0].legs).toBe(1);
      expect(result1.gameState.players[0].score).toBe(501); // Reset
      expect(result1.events.some(e => e.type === 'leg_won')).toBe(true);
    });

    it('should handle game win after multiple legs', () => {
      const state = {
        ...initialState,
        firstTo: 1,
        players: [{ ...initialState.players[0], score: 50, legs: 0 }, initialState.players[1]],
      };

      const msg = { type: 'score', data: { value: 50 } };
      const { gameState, events } = dispatchMessage(state, msg);

      expect(gameState.gameOver).toBe(true);
      expect(gameState.winner).toBe(0);
      expect(events.some(e => e.type === 'game_won')).toBe(true);
    });

    it('should prevent score input after game over', () => {
      const state = { ...initialState, gameOver: true, winner: 0 };
      const msg = { type: 'score', data: { value: 20 } };
      const { events } = dispatchMessage(state, msg);

      expect(events[0].type).toBe('error');
    });

    it('should handle bust and allow retry', () => {
      const state = {
        ...initialState,
        players: [{ ...initialState.players[0], score: 10 }, initialState.players[1]],
      };

      const msg = { type: 'score', data: { value: 20 } };
      const result1 = dispatchMessage(state, msg);

      expect(result1.events[0].type).toBe('bust');
      expect(result1.gameState.players[0].score).toBe(10); // Unchanged

      // Can retry with valid score
      const msg2 = { type: 'score', data: { value: 5 } };
      const result2 = dispatchMessage(result1.gameState, msg2);
      expect(result2.gameState.players[0].score).toBe(5);
    });

    it('should track averages through multiple scores', () => {
      let state = initialState;

      // Three darts of 20 each
      for (let i = 0; i < 3; i++) {
        const msg = { type: 'score', data: { value: 20 } };
        const result = dispatchMessage(state, msg);
        state = result.gameState;
      }

      expect(state.players[0].dartsThrown).toBe(3);
      expect(state.players[0].totalScored).toBe(60);
      expect(state.players[0].average).toBe(60);
    });
  });

  describe('broadcastEvents', () => {
    it('should send events to all open connections', () => {
      const events = [
        { type: 'score_added', data: { value: 20 } },
        { type: 'player_switched', data: { activePlayerIndex: 1 } },
      ];

      const mockClient1 = { send: jest.fn(), readyState: 1 };
      const mockClient2 = { send: jest.fn(), readyState: 1 };
      const roomClients = [mockClient1, mockClient2];

      broadcastEvents(events, roomClients);

      expect(mockClient1.send).toHaveBeenCalledTimes(2);
      expect(mockClient2.send).toHaveBeenCalledTimes(2);
    });

    it('should skip closed connections', () => {
      const events = [{ type: 'score_added', data: { value: 20 } }];

      const mockClient1 = { send: jest.fn(), readyState: 1 };
      const mockClient2 = { send: jest.fn(), readyState: 3 }; // CLOSED
      const roomClients = [mockClient1, mockClient2];

      broadcastEvents(events, roomClients);

      expect(mockClient1.send).toHaveBeenCalledTimes(1);
      expect(mockClient2.send).not.toHaveBeenCalled();
    });

    it('should skip null connections', () => {
      const events = [{ type: 'score_added', data: { value: 20 } }];

      const mockClient = { send: jest.fn(), readyState: 1 };
      const roomClients = [null, mockClient, undefined];

      broadcastEvents(events, roomClients);

      expect(mockClient.send).toHaveBeenCalledTimes(1);
    });

    it('should wrap events in transport format', () => {
      const events = [{ type: 'score_added', data: { value: 20 } }];

      const mockClient = { send: jest.fn(), readyState: 1 };
      const roomClients = [mockClient];

      broadcastEvents(events, roomClients);

      const sentMessage = JSON.parse(mockClient.send.mock.calls[0][0]);
      expect(sentMessage.type).toBe('stateUpdate');
      expect(sentMessage.event).toBe('score_added');
      expect(sentMessage.timestamp).toBeDefined();
    });
  });

  describe('handleRoomMessage', () => {
    it('should update room state and broadcast', () => {
      const rooms = new Map();
      const roomId = 'TESTROOM';
      rooms.set(roomId, initialState);

      const mockClient = { send: jest.fn(), readyState: 1 };
      const roomClients = [mockClient];

      const message = { type: 'score', data: { value: 20 } };
      const result = handleRoomMessage(rooms, roomId, message, roomClients);

      expect(result.success).toBe(true);
      expect(result.gameState.players[0].score).toBe(481);
      expect(mockClient.send).toHaveBeenCalled();
    });

    it('should return error for non-existent room', () => {
      const rooms = new Map();
      const result = handleRoomMessage(rooms, 'NOROOM', {}, []);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Room not found');
    });

    it('should update room state persistently', () => {
      const rooms = new Map();
      const roomId = 'TESTROOM';
      rooms.set(roomId, initialState);

      const msg1 = { type: 'score', data: { value: 100 } };
      handleRoomMessage(rooms, roomId, msg1, []);

      const msg2 = { type: 'score', data: { value: 50 } };
      handleRoomMessage(rooms, roomId, msg2, []);

      const finalState = rooms.get(roomId);
      expect(finalState.players[0].score).toBe(351); // 501 - 100 - 50
    });
  });
});
