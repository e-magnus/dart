// Detect WebSocket URL based on environment
function getWebSocketURL() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host || 'localhost:8080';
  // If loaded from file://, use localhost
  if (window.location.protocol === 'file:') {
    return 'ws://localhost:8080';
  }
  return `${protocol}//${host}`;
}

const WS_URL = getWebSocketURL();

let gameState = {
  players: [
    { name: 'Player 1', score: 501, legs: 0, isActive: true, dartsThrown: 0, average: 0 },
    { name: 'Player 2', score: 501, legs: 0, isActive: false, dartsThrown: 0, average: 0 },
  ],
  firstTo: 5,
  gameOver: false,
  winner: null,
};

let ws;
let lastScores = [501, 501];
let legToastTimer = null;

/**
 * Initialize WebSocket connection and set up event listeners
 */
function initWebSocket() {
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log('Connected to game server');
  };

  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.type === 'stateUpdate') {
      updateGameState(message.data);
    }
  };

  ws.onerror = error => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('Disconnected from server, retrying...');
    setTimeout(initWebSocket, 2000);
  };
}

/**
 * Update game state and UI
 */
function updateGameState(newState) {
  const oldGameOver = gameState.gameOver;
  const oldWinner = gameState.winner;

  gameState = newState;

  // Update player names
  document.getElementById('p1-name').textContent = gameState.players[0].name;
  document.getElementById('p2-name').textContent = gameState.players[1].name;

  // Update scores with animation
  updateScoreDisplay(0);
  updateScoreDisplay(1);

  // Update averages and legs
  document.getElementById('p1-avg').textContent = (gameState.players[0].average || 0).toFixed(1);
  document.getElementById('p2-avg').textContent = (gameState.players[1].average || 0).toFixed(1);
  document.getElementById('p1-legs').textContent = gameState.players[0].legs;
  document.getElementById('p2-legs').textContent = gameState.players[1].legs;

  // Update active player indicator
  updateActiveIndicator();

  // Update checkout suggestions
  updateCheckoutSuggestion(0);
  updateCheckoutSuggestion(1);

  // Update heading to show game mode (e.g., "501 - Best of 5")
  updateGameHeading();

  // Leg win toast (only when a leg just finished and match not already ended)
  if (gameState.legWin && gameState.legWinner !== undefined && gameState.legWinner !== null) {
    const isGameWin = !!gameState.gameWin;
    showLegToast(gameState.players[gameState.legWinner].name, isGameWin);
  }

  // Trigger win animation if game just ended
  if (!oldGameOver && gameState.gameOver && gameState.winner !== null) {
    triggerWinAnimation();
  }
}

/**
 * Update score display with flash animation if score changed
 */
function updateScoreDisplay(playerIndex) {
  const scoreElement = document.getElementById(`p${playerIndex + 1}-score`);
  const dartsElement = document.getElementById(`p${playerIndex + 1}-darts`);
  const newScore = gameState.players[playerIndex].score;
  const oldScore = lastScores[playerIndex];

  scoreElement.textContent = newScore;
  dartsElement.textContent = `(${gameState.players[playerIndex].dartsThrown || 0})`;

  if (oldScore !== newScore && oldScore !== 501 && oldScore !== undefined) {
    scoreElement.classList.remove('update-flash');
    void scoreElement.offsetWidth; // Trigger reflow
    scoreElement.classList.add('update-flash');
  }

  lastScores[playerIndex] = newScore;
}

/**
 * Update active player indicator
 */
function updateActiveIndicator() {
  const p1Row = document.getElementById('player1-section');
  const p2Row = document.getElementById('player2-section');

  if (gameState.players[0].isActive) {
    p1Row.classList.add('active');
    p2Row.classList.remove('active');
  } else {
    p1Row.classList.remove('active');
    p2Row.classList.add('active');
  }
}

/**
 * Update checkout suggestion display
 */
function updateCheckoutSuggestion(playerIndex) {
  const checkoutElement = document.getElementById('checkout');
  if (!checkoutElement) return;

  const score = gameState.players[playerIndex].score;

  if (gameState.checkoutSuggestion && gameState.players[playerIndex].isActive && score <= 170) {
    checkoutElement.textContent = gameState.checkoutSuggestion;
    checkoutElement.classList.add('visible');
  } else {
    checkoutElement.textContent = '';
    checkoutElement.classList.remove('visible');
  }
}

function updateGameHeading() {
  const headingEl = document.getElementById('game-heading');
  if (!headingEl) return;
  const startScore = gameState.startScore || 501;
  const firstTo = gameState.firstTo || 1;
  const headingText =
    firstTo === 1
      ? `${startScore} - 1 leggur til sigurs`
      : `${startScore} - ${firstTo} leggir til sigurs`;
  headingEl.textContent = headingText;
}

/**
 * Trigger win animation
 */
function triggerWinAnimation() {
  const winAnimation = document.getElementById('win-animation');
  const winnerName = gameState.players[gameState.winner].name;
  document.getElementById('winner-name').textContent = winnerName;

  winAnimation.classList.remove('active');
  void winAnimation.offsetWidth; // Trigger reflow
  winAnimation.classList.add('active');
}

function showLegToast(name, isMatchWin) {
  const toast = document.getElementById('leg-toast');
  if (!toast) return;

  const text = isMatchWin ? `${name} vinnur leikinn` : `${name} vinnur legg`;
  toast.textContent = text;

  toast.classList.remove('show');
  void toast.offsetWidth; // force reflow
  toast.classList.add('show');

  if (legToastTimer) {
    clearTimeout(legToastTimer);
  }
  legToastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2400);
}

function applyObsMode() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('obs')) {
    document.body.classList.add('obs-mode');
  }
}

function setInitialWindowSize() {
  try {
    if (typeof window.resizeTo === 'function') {
      window.resizeTo(700, 350);
    }
  } catch (err) {
    console.warn('Could not resize window:', err);
  }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  applyObsMode();
  setInitialWindowSize();
  initWebSocket();
});
