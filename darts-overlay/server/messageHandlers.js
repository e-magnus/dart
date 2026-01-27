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
        // Switch active player (supports N players)
        const switched = switchActivePlayer(newState);
        newState.players = switched.players;
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
  const newState = switchActivePlayer(JSON.parse(JSON.stringify(gameState)));
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
  const players = names.map((name, index) => ({
    name,
    score: startScore,
    legs: 0,
    sets: 0,
    isActive: index === 0,
    dartsThrown: 0,
    totalScored: 0,
    average: 0
  }));

  const newState = {
    players,
    firstTo,
    startScore,
    history: [],
    gameOver: false,
    winner: null,
    lastLegWinner: null,
    nextLegStartPlayer: 1,
    bullUpPhase: false,
    bullUpScores: []
  };

  return { gameState: newState, events: [{ type: 'game_reset', data: { startScore, firstTo } }] };
}

/**
 * Handle bull-up throw to determine player order
 * Score is calculated as distance from bull (50 = bullseye, 25 = outer bull, etc.)
 */
function handleBullUpThrow(gameState, playerIndex, score) {
  if (!gameState.bullUpPhase) {
    return { gameState, events: [{ type: 'error', data: 'Not in bull-up phase' }] };
  }

  const newState = JSON.parse(JSON.stringify(gameState));
  
  // Record this player's bull-up throw
  newState.bullUpScores.push({ playerIndex, score });
  
  const events = [{ type: 'bull_up_throw', data: { playerIndex, score } }];
  
  // Check if all players have thrown
  if (newState.bullUpScores.length === newState.players.length) {
    // Sort by score (highest first)
    const sorted = [...newState.bullUpScores].sort((a, b) => b.score - a.score);
    
    // Reorder players based on bull-up results
    const newPlayers = sorted.map((entry, index) => ({
      ...newState.players[entry.playerIndex],
      isActive: index === 0 // First player is active
    }));
    
    newState.players = newPlayers;
    newState.bullUpPhase = false;
    newState.bullUpScores = [];
    
    events.push({ type: 'bull_up_complete', data: { playerOrder: sorted.map(s => s.playerIndex) } });
  }
  
  return { gameState: newState, events };
}

/**
 * Start bull-up phase
 */
function handleStartBullUp(gameState) {
  const newState = JSON.parse(JSON.stringify(gameState));
  newState.bullUpPhase = true;
  newState.bullUpScores = [];
  
  // Deactivate all players during bull-up
  newState.players.forEach(p => p.isActive = false);
  
  return { gameState: newState, events: [{ type: 'bull_up_started', data: {} }] };
}

module.exports = {
  handleAddScore,
  handleSwitchPlayer,
  handleUpdatePlayerName,
  handleResetGame,
  handleBullUpThrow,
  handleStartBullUp
};
