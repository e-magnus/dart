const {
  computeAverage,
  updatePlayerAverages,
  createInitialGameState,
  isBust,
  isCheckout,
  addDartScore,
  resetPlayerForNextLeg,
  switchActivePlayer,
} = require('../gameLogic');

describe('Game Logic', () => {
  describe('computeAverage', () => {
    it('should return 0 for player with no darts thrown', () => {
      const player = { dartsThrown: 0, totalScored: 0 };
      expect(computeAverage(player)).toBe(0);
    });

    it('should calculate average correctly', () => {
      const player = { dartsThrown: 3, totalScored: 60 };
      // 60 / 3 * 3 = 60
      expect(computeAverage(player)).toBe(60);
    });

    it('should handle decimal averages', () => {
      const player = { dartsThrown: 6, totalScored: 40 };
      // 40 / 6 * 3 = 20
      expect(computeAverage(player)).toBeCloseTo(20, 1);
    });
  });

  describe('isBust', () => {
    it('should detect score < 0 as bust', () => {
      expect(isBust(-5)).toBe(true);
      expect(isBust(-1)).toBe(true);
    });

    it('should detect score = 1 as bust', () => {
      expect(isBust(1)).toBe(true);
    });

    it('should not mark 0 as bust', () => {
      expect(isBust(0)).toBe(false);
    });

    it('should not mark positive scores > 1 as bust', () => {
      expect(isBust(2)).toBe(false);
      expect(isBust(100)).toBe(false);
    });
  });

  describe('isCheckout', () => {
    it('should identify exact 0 as valid checkout', () => {
      expect(isCheckout(0)).toBe(true);
    });

    it('should not mark non-zero as checkout', () => {
      expect(isCheckout(1)).toBe(false);
      expect(isCheckout(50)).toBe(false);
      expect(isCheckout(-1)).toBe(false);
    });
  });

  describe('addDartScore', () => {
    it('should subtract dart value from current score', () => {
      const result = addDartScore(501, 20);
      expect(result.newScore).toBe(481);
      expect(result.isBust).toBe(false);
      expect(result.isCheckout).toBe(false);
    });

    it('should detect checkout (exact 0)', () => {
      const result = addDartScore(50, 50);
      expect(result.newScore).toBe(0);
      expect(result.isCheckout).toBe(true);
      expect(result.isBust).toBe(false);
    });

    it('should detect bust (score < 0)', () => {
      const result = addDartScore(10, 20);
      expect(result.newScore).toBe(-10);
      expect(result.isBust).toBe(true);
    });

    it('should detect bust (score = 1)', () => {
      const result = addDartScore(3, 2);
      expect(result.newScore).toBe(1);
      expect(result.isBust).toBe(true);
    });
  });

  describe('resetPlayerForNextLeg', () => {
    it('should reset score and dart tracking', () => {
      const player = {
        name: 'Test',
        score: 100,
        legs: 1,
        dartsThrown: 30,
        totalScored: 450,
        average: 45,
      };
      const reset = resetPlayerForNextLeg(player, 501);
      expect(reset.score).toBe(501);
      expect(reset.dartsThrown).toBe(0);
      expect(reset.totalScored).toBe(0);
      expect(reset.average).toBe(0);
      expect(reset.name).toBe('Test');
      expect(reset.legs).toBe(1); // Legs should not reset
    });
  });

  describe('switchActivePlayer', () => {
    it('should toggle active player status', () => {
      const state = createInitialGameState();
      expect(state.players[0].isActive).toBe(true);
      expect(state.players[1].isActive).toBe(false);

      const switched = switchActivePlayer(state);
      expect(switched.players[0].isActive).toBe(false);
      expect(switched.players[1].isActive).toBe(true);
    });

    it('should not mutate original state', () => {
      const state = createInitialGameState();
      const switched = switchActivePlayer(state);
      expect(state.players[0].isActive).toBe(true);
      expect(switched.players[0].isActive).toBe(false);
    });

    it('should rotate through multiple players', () => {
      const state = createInitialGameState(3);
      expect(state.players[0].isActive).toBe(true);

      const next = switchActivePlayer(state);
      expect(next.players[0].isActive).toBe(false);
      expect(next.players[1].isActive).toBe(true);

      const next2 = switchActivePlayer(next);
      expect(next2.players[1].isActive).toBe(false);
      expect(next2.players[2].isActive).toBe(true);

      const next3 = switchActivePlayer(next2);
      expect(next3.players[2].isActive).toBe(false);
      expect(next3.players[0].isActive).toBe(true);
    });
  });

  describe('createInitialGameState', () => {
    it('should create valid initial state', () => {
      const state = createInitialGameState();
      expect(state.players).toHaveLength(2);
      expect(state.players[0].score).toBe(501);
      expect(state.players[1].score).toBe(501);
      expect(state.firstTo).toBe(3);
      expect(state.gameOver).toBe(false);
      expect(state.winner).toBeNull();
    });

    it('should create state for variable player count', () => {
      const state = createInitialGameState(4);
      expect(state.players).toHaveLength(4);
      expect(state.players[0].isActive).toBe(true);
      expect(state.players[3].isActive).toBe(false);
    });

    it('should set correct initial active player', () => {
      const state = createInitialGameState();
      expect(state.players[0].isActive).toBe(true);
      expect(state.players[1].isActive).toBe(false);
    });
  });

  describe('updatePlayerAverages', () => {
    it('should update averages for all players', () => {
      const state = createInitialGameState();
      state.players[0].dartsThrown = 9;
      state.players[0].totalScored = 180;
      state.players[1].dartsThrown = 6;
      state.players[1].totalScored = 120;

      const updated = updatePlayerAverages(state);
      expect(updated.players[0].average).toBe(60); // 180 / 9 * 3
      expect(updated.players[1].average).toBe(60); // 120 / 6 * 3
    });
  });
});
