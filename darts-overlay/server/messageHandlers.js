/**
 * WebSocket Message Handlers
 * Pure functions that process incoming client messages and return new state
 */

const { addDartScore, isBust, isCheckout, switchActivePlayer } = require('./gameLogic');

/**
 * Process a score addition message
 * Returns { newState, events } where events are [{ type, data }]
 */
function handleAddScore(gameState, dartValue) {
  if (gameState.gameOver) {
    return { gameState, events: [{ type: 'error', data: 'Game is over' }] };
  }

  const activePlayerIndex = gameState.players.findIndex(p => p.isActive);
  if (activePlayerIndex === -1) {
    return { gameState, events: [{ type: 'error', data: 'No active player' }] };
  }

  const player = gameState.players[activePlayerIndex];
  const { newScore, isBust: isBusted, isCheckout: isExactCheckout } = addDartScore(player.score, dartValue);

  // Clone state
  const newState = JSON.parse(JSON.stringify(gameState));
  const newPlayer = newState.players[activePlayerIndex];

  const events = [];

  if (isBusted) {
    // Bust - no score change, but log the attempt
    events.push({ type: 'bust', data: { playerIndex: activePlayerIndex, attemptedScore: dartValue } });
  } else {
    // Valid score
    newPlayer.score = newScore;
    newPlayer.dartsThrown += 1;
    newPlayer.totalScored += dartValue;
    newPlayer.average = (newPlayer.totalScored / newPlayer.dartsThrown) * 3;

    if (isExactCheckout) {
      // Leg won
      newPlayer.legs += 1;
      events.push({ type: 'leg_won', data: { playerIndex: activePlayerIndex, legs: newPlayer.legs } });

      // Check if match won
      if (newPlayer.legs >= newState.firstTo) {
        newState.gameOver = true;
        newState.winner = activePlayerIndex;
        events.push({ type: 'game_won', data: { playerIndex: activePlayerIndex } });
      } else {
        // Reset for next leg
        newPlayer.score = newState.startScore;
        newPlayer.dartsThrown = 0;
        newPlayer.totalScored = 0;
        // Switch active player
        const temp = newState.players[0].isActive;
        newState.players[0].isActive = newState.players[1].isActive;
        newState.players[1].isActive = temp;
        events.push({ type: 'next_leg', data: { activePlayerIndex: newState.players.findIndex(p => p.isActive) } });
      }
    } else {
      events.push({ type: 'score_added', data: { playerIndex: activePlayerIndex, newScore, dartValue } });
    }
  }

  return { gameState: newState, events };
}

/**
 * Switch active player
 */
function handleSwitchPlayer(gameState) {
  if (gameState.gameOver) {
    return { gameState, events: [{ type: 'error', data: 'Game is over' }] };
  }
  const newState = JSON.parse(JSON.stringify(gameState));
  const temp = newState.players[0].isActive;
  newState.players[0].isActive = newState.players[1].isActive;
  newState.players[1].isActive = temp;
  const activeIdx = newState.players.findIndex(p => p.isActive);
  return { gameState: newState, events: [{ type: 'player_switched', data: { activePlayerIndex: activeIdx } }] };
}

/**
 * Update player name
 */
function handleUpdatePlayerName(gameState, playerIndex, newName) {
  if (playerIndex < 0 || playerIndex >= gameState.players.length) {
    return { gameState, events: [{ type: 'error', data: 'Invalid player index' }] };
  }
  const newState = JSON.parse(JSON.stringify(gameState));
  newState.players[playerIndex].name = newName;
  return { gameState: newState, events: [{ type: 'name_updated', data: { playerIndex, newName } }] };
}

/**
 * Reset game
 */
function handleResetGame(gameState) {
  // Create fresh initial state but keep startScore
  const startScore = gameState.startScore || 501;
  const firstTo = gameState.firstTo || 3;
  const names = gameState.players.map(p => p.name);

  const newState = {
    players: [
      { name: names[0], score: startScore, legs: 0, sets: 0, isActive: true, dartsThrown: 0, totalScored: 0, average: 0 },
      { name: names[1], score: startScore, legs: 0, sets: 0, isActive: false, dartsThrown: 0, totalScored: 0, average: 0 }
    ],
    firstTo,
    startScore,
    history: [],
    gameOver: false,
    winner: null,
    lastLegWinner: null,
    nextLegStartPlayer: 1
  };

  return { gameState: newState, events: [{ type: 'game_reset', data: { startScore, firstTo } }] };
}

module.exports = {
  handleAddScore,
  handleSwitchPlayer,
  handleUpdatePlayerName,
  handleResetGame
};
