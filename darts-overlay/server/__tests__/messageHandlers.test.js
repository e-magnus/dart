const {
  handleAddScore,
  handleSwitchPlayer,
  handleUpdatePlayerName,
  handleResetGame,
  handleBullUpThrow,
  handleStartBullUp
} = require('../messageHandlers');
const { createInitialGameState } = require('../gameLogic');

describe('Message Handlers', () => {
  let initialState;

  beforeEach(() => {
    initialState = createInitialGameState();
  });

  describe('handleAddScore', () => {
    it('should add valid dart score', () => {
      const { gameState, events } = handleAddScore(initialState, 20);
      expect(gameState.players[0].score).toBe(481);
      expect(gameState.players[0].dartsThrown).toBe(1);
      expect(gameState.players[0].totalScored).toBe(20);
      expect(events[0].type).toBe('score_added');
    });

    it('should handle bust (score < 0)', () => {
      const state = { ...initialState, players: [{ ...initialState.players[0], score: 10 }, initialState.players[1]] };
      const { gameState, events } = handleAddScore(state, 20);
      expect(gameState.players[0].score).toBe(10); // No change
      expect(events[0].type).toBe('bust');
    });

    it('should handle bust (score = 1)', () => {
      const state = { ...initialState, players: [{ ...initialState.players[0], score: 3 }, initialState.players[1]] };
      const { gameState, events } = handleAddScore(state, 2);
      expect(gameState.players[0].score).toBe(3); // No change
      expect(events[0].type).toBe('bust');
    });

    it('should detect leg win on exact checkout', () => {
      const state = { ...initialState, players: [{ ...initialState.players[0], score: 50 }, initialState.players[1]] };
      const { gameState, events } = handleAddScore(state, 50);
      expect(gameState.players[0].score).toBe(501); // Reset for next leg
      expect(gameState.players[0].legs).toBe(1);
      expect(events.some(e => e.type === 'leg_won')).toBe(true);
      expect(events.some(e => e.type === 'next_leg')).toBe(true);
    });

    it('should detect game win when player reaches firstTo', () => {
      const state = {
        ...initialState,
        firstTo: 1,
        players: [{ ...initialState.players[0], score: 50, legs: 0 }, initialState.players[1]]
      };
      const { gameState, events } = handleAddScore(state, 50);
      expect(gameState.gameOver).toBe(true);
      expect(gameState.winner).toBe(0);
      expect(events.some(e => e.type === 'game_won')).toBe(true);
    });

    it('should reject score when game is over', () => {
      const state = { ...initialState, gameOver: true, winner: 0 };
      const { gameState, events } = handleAddScore(state, 20);
      expect(gameState.score).toBeUndefined();
      expect(events[0].type).toBe('error');
    });

    it('should switch player after leg win', () => {
      const state = { ...initialState, players: [{ ...initialState.players[0], score: 50 }, initialState.players[1]] };
      const { gameState } = handleAddScore(state, 50);
      expect(gameState.players[0].isActive).toBe(false);
      expect(gameState.players[1].isActive).toBe(true);
    });

    it('should calculate average correctly', () => {
      let state = initialState;
      // Throw 3 darts of 20 points each
      for (let i = 0; i < 3; i++) {
        const result = handleAddScore(state, 20);
        state = result.gameState;
      }
      expect(state.players[0].dartsThrown).toBe(3);
      expect(state.players[0].totalScored).toBe(60);
      expect(state.players[0].average).toBe(60); // 60 / 3 * 3 = 60
    });
  });

  describe('handleSwitchPlayer', () => {
    it('should toggle active player', () => {
      const { gameState } = handleSwitchPlayer(initialState);
      expect(gameState.players[0].isActive).toBe(false);
      expect(gameState.players[1].isActive).toBe(true);
    });

    it('should rotate active player for more than two players', () => {
      const state = createInitialGameState(3);
      const { gameState } = handleSwitchPlayer(state);
      expect(gameState.players[0].isActive).toBe(false);
      expect(gameState.players[1].isActive).toBe(true);
      expect(gameState.players[2].isActive).toBe(false);
    });

    it('should emit player_switched event', () => {
      const { events } = handleSwitchPlayer(initialState);
      expect(events[0].type).toBe('player_switched');
      expect(events[0].data.activePlayerIndex).toBe(1);
    });

    it('should reject when game is over', () => {
      const state = { ...initialState, gameOver: true };
      const { events } = handleSwitchPlayer(state);
      expect(events[0].type).toBe('error');
    });
  });

  describe('handleUpdatePlayerName', () => {
    it('should update player name', () => {
      const { gameState } = handleUpdatePlayerName(initialState, 0, 'Alice');
      expect(gameState.players[0].name).toBe('Alice');
      expect(gameState.players[1].name).toBe('Leikmaður 2');
    });

    it('should emit name_updated event', () => {
      const { events } = handleUpdatePlayerName(initialState, 1, 'Bob');
      expect(events[0].type).toBe('name_updated');
      expect(events[0].data.newName).toBe('Bob');
    });

    it('should reject invalid player index', () => {
      const { events } = handleUpdatePlayerName(initialState, 5, 'Invalid');
      expect(events[0].type).toBe('error');
    });
  });

  describe('handleResetGame', () => {
    it('should reset game state', () => {
      const state = {
        ...initialState,
        players: [
          { ...initialState.players[0], score: 100, legs: 2 },
          { ...initialState.players[1], score: 50, legs: 1 }
        ]
      };
      const { gameState } = handleResetGame(state);
      expect(gameState.players[0].score).toBe(501);
      expect(gameState.players[0].legs).toBe(0);
      expect(gameState.players[1].score).toBe(501);
      expect(gameState.players[1].legs).toBe(0);
      expect(gameState.gameOver).toBe(false);
    });

    it('should reset game state for multiple players', () => {
      const state = createInitialGameState(3);
      state.players[0].score = 100;
      state.players[1].score = 200;
      state.players[2].score = 300;
      const { gameState } = handleResetGame(state);
      expect(gameState.players).toHaveLength(3);
      expect(gameState.players[0].score).toBe(501);
      expect(gameState.players[1].score).toBe(501);
      expect(gameState.players[2].score).toBe(501);
      expect(gameState.players[0].isActive).toBe(true);
    });

    it('should preserve player names', () => {
      const state = {
        ...initialState,
        players: [
          { ...initialState.players[0], name: 'Alice' },
          { ...initialState.players[1], name: 'Bob' }
        ]
      };
      const { gameState } = handleResetGame(state);
      expect(gameState.players[0].name).toBe('Alice');
      expect(gameState.players[1].name).toBe('Bob');
    });

    it('should emit game_reset event', () => {
      const { events } = handleResetGame(initialState);
      expect(events[0].type).toBe('game_reset');
    });
  });

  describe('bull-up flow', () => {
    it('should start bull-up phase', () => {
      const { gameState, events } = handleStartBullUp(initialState);
      expect(gameState.bullUpPhase).toBe(true);
      expect(gameState.bullUpScores).toHaveLength(0);
      expect(gameState.players.every(p => p.isActive === false)).toBe(true);
      expect(events[0].type).toBe('bull_up_started');
    });

    it('should record bull-up throws and reorder players', () => {
      let state = createInitialGameState(3);
      state = handleStartBullUp(state).gameState;

      let result = handleBullUpThrow(state, 0, 25);
      expect(result.gameState.bullUpScores).toHaveLength(1);
      expect(result.events[0].type).toBe('bull_up_throw');

      result = handleBullUpThrow(result.gameState, 1, 50);
      result = handleBullUpThrow(result.gameState, 2, 10);

      expect(result.events.some(e => e.type === 'bull_up_complete')).toBe(true);
      expect(result.gameState.bullUpPhase).toBe(false);
      expect(result.gameState.bullUpScores).toHaveLength(0);
      expect(result.gameState.players[0].isActive).toBe(true);
    });

    it('should reject bull-up throw when not in phase', () => {
      const { events } = handleBullUpThrow(initialState, 0, 25);
      expect(events[0].type).toBe('error');
    });
  });
});
