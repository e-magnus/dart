/**
 * Game logic utilities - separated from WebSocket/HTTP handling
 * This module contains pure functions for darts game rules
 */

// Compute player average (points per 3 darts)
function computeAverage(player) {
  if (!player || !player.dartsThrown) {
    return 0;
  }
  return (player.totalScored / player.dartsThrown) * 3;
}

// Update averages for all players
function updatePlayerAverages(gameState) {
  gameState.players.forEach(p => {
    p.average = computeAverage(p);
  });
  return gameState;
}

// Create initial game state
function createInitialGameState(playerCount = 2) {
  const players = [];
  for (let i = 0; i < playerCount; i++) {
    players.push({
      name: `Leikmaður ${i + 1}`,
      score: 501,
      legs: 0,
      sets: 0,
      isActive: i === 0,
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
    nextLegStartPlayer: 1,
    bullUpPhase: false,
    bullUpScores: [],
  };
}

// Check if a score is a valid bust (< 0 or = 1)
function isBust(score) {
  return score < 0 || score === 1;
}

// Check if a score is exactly 0 (valid finish)
function isCheckout(score) {
  return score === 0;
}

// Add dart score to player, return { newScore, isBust, isCheckout }
function addDartScore(currentScore, dartValue) {
  const newScore = currentScore - dartValue;
  return {
    newScore,
    isBust: isBust(newScore),
    isCheckout: isCheckout(newScore),
  };
}

// Reset player for next leg
function resetPlayerForNextLeg(player, startScore) {
  return {
    ...player,
    score: startScore,
    dartsThrown: 0,
    totalScored: 0,
    average: 0,
  };
}

// Switch active player
function switchActivePlayer(gameState) {
  const newState = {
    ...gameState,
    players: gameState.players.map(p => ({ ...p })),
  };

  // Find currently active player
  const currentActiveIndex = newState.players.findIndex(p => p.isActive);

  // Deactivate current player
  if (currentActiveIndex !== -1) {
    newState.players[currentActiveIndex].isActive = false;
  }

  // Activate next player (circular rotation)
  const nextIndex = (currentActiveIndex + 1) % newState.players.length;
  newState.players[nextIndex].isActive = true;

  return newState;
}

module.exports = {
  computeAverage,
  updatePlayerAverages,
  createInitialGameState,
  isBust,
  isCheckout,
  addDartScore,
  resetPlayerForNextLeg,
  switchActivePlayer,
};
