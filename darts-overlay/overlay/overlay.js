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

// Get room ID from URL parameter
function getRoomIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || params.get('roomId') || 'default';
}

const WS_URL = getWebSocketURL();
const currentRoomId = getRoomIdFromURL();

let gameState = {
    players: [
        { name: 'Player 1', score: 501, legs: 0, isActive: true, dartsThrown: 0, average: 0 },
        { name: 'Player 2', score: 501, legs: 0, isActive: false, dartsThrown: 0, average: 0 }
    ],
    firstTo: 5,
    gameOver: false,
    winner: null
};

let ws;
let lastScores = [501, 501];
let lastDartsThrown = [0, 0];
let legWinTimer = null;
let pendingLegUpdate = null; // { index, prevLegs, newLegs }
let bustTimer = null;
let pendingState = null;
let updateTimer = null;
let reconnectDelay = 1000;
let reconnectTimer = null;
const MAX_RECONNECT_DELAY = 10000;
const elementCache = {};

function getEl(id) {
    if (elementCache[id]) return elementCache[id];
    const el = document.getElementById(id);
    if (el) elementCache[id] = el;
    return el;
}

function setTextIfChanged(el, value) {
    if (!el) return;
    const next = String(value);
    if (el.textContent !== next) {
        el.textContent = next;
    }
}

function setConnectionStatus(status) {
    const statusEl = getEl('overlay-status');
    if (!statusEl) return;

    statusEl.className = `overlay-status ${status}`;
    if (status === 'connected') {
        statusEl.textContent = ''; // Hide status when connected
    } else if (status === 'reconnecting') {
        statusEl.textContent = 'Endurtengir...';
    } else if (status === 'error') {
        statusEl.textContent = 'Villa í tengingu';
    } else {
        statusEl.textContent = 'Tengist...';
    }
}

function scheduleStateUpdate(newState) {
    pendingState = newState;
    if (updateTimer) return;
    updateTimer = setTimeout(() => {
        const state = pendingState;
        pendingState = null;
        updateTimer = null;
        if (state) {
            updateGameState(state);
        }
    }, 50);
}

/**
 * Initialize WebSocket connection and set up event listeners
 */
function initWebSocket() {
    setConnectionStatus('connecting');
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        console.log('Connected to game server, joining room:', currentRoomId);
        setConnectionStatus('connected');
        reconnectDelay = 1000;
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
        // Join room immediately upon connection
        ws.send(JSON.stringify({ 
            type: 'join',
            roomId: currentRoomId
        }));
    };

    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            if (message.type === 'stateUpdate' && message.data) {
                scheduleStateUpdate(message.data);
            }
        } catch (err) {
            console.warn('Invalid message from server:', err);
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
    };

    ws.onclose = () => {
        console.log('Disconnected from server, retrying...');
        setConnectionStatus('reconnecting');
        if (!reconnectTimer) {
            reconnectTimer = setTimeout(() => {
                reconnectTimer = null;
                initWebSocket();
            }, reconnectDelay);
            reconnectDelay = Math.min(reconnectDelay * 1.5, MAX_RECONNECT_DELAY);
        }
    };
}

/**
 * Update game state and UI
 */
function updateGameState(newState) {
    const prevState = gameState;
    gameState = newState;

    // Handle leg-win animation before updating legs text
    const isLegWin = !!newState.legWin && typeof newState.legWinner === 'number';
    if (isLegWin) {
        const winnerIndex = newState.legWinner;
        const prevLegs = (prevState && prevState.players && prevState.players[winnerIndex]) ? prevState.players[winnerIndex].legs : 0;
        const newLegs = newState.players[winnerIndex].legs;
        pendingLegUpdate = { index: winnerIndex, prevLegs, newLegs };
        triggerLegTrophyAnimation(winnerIndex, prevLegs, newLegs);
    } else {
        pendingLegUpdate = null;
    }

    // Update player names
    setTextIfChanged(getEl('p1-name'), gameState.players[0].name);
    setTextIfChanged(getEl('p2-name'), gameState.players[1].name);

    // Update scores with animation
    updateScoreDisplay(0);
    updateScoreDisplay(1);

    // Update averages
    setTextIfChanged(getEl('p1-avg'), (gameState.players[0].average || 0).toFixed(1));
    setTextIfChanged(getEl('p2-avg'), (gameState.players[1].average || 0).toFixed(1));

    // Update legs, but if leg-win animation running, hold winner's legs until animation completes
    const p1LegsEl = getEl('p1-legs');
    const p2LegsEl = getEl('p2-legs');
    if (pendingLegUpdate && pendingLegUpdate.index === 0) {
        setTextIfChanged(p1LegsEl, pendingLegUpdate.prevLegs);
        setTextIfChanged(p2LegsEl, gameState.players[1].legs);
    } else if (pendingLegUpdate && pendingLegUpdate.index === 1) {
        setTextIfChanged(p1LegsEl, gameState.players[0].legs);
        setTextIfChanged(p2LegsEl, pendingLegUpdate.prevLegs);
    } else {
        setTextIfChanged(p1LegsEl, gameState.players[0].legs);
        setTextIfChanged(p2LegsEl, gameState.players[1].legs);
    }

    // Update active/trophy indicator
    updateActiveOrWinnerIndicator(newState);

    // Update checkout suggestions
    updateCheckoutSuggestion(0);
    updateCheckoutSuggestion(1);

    // Update heading to show game mode
    updateGameHeading();
}

/**
 * Update score display with flash animation if score changed
 */
function updateScoreDisplay(playerIndex) {
    const scoreElement = getEl(`p${playerIndex + 1}-score`);
    const dartsElement = getEl(`p${playerIndex + 1}-darts`);
    const newScore = gameState.players[playerIndex].score;
    const oldScore = lastScores[playerIndex];
    const newDarts = gameState.players[playerIndex].dartsThrown || 0;
    const oldDarts = lastDartsThrown[playerIndex];

    if (scoreElement) setTextIfChanged(scoreElement, newScore);
    if (dartsElement) setTextIfChanged(dartsElement, `(${newDarts})`);

    // Detect bust: score didn't change but darts were thrown (darts increased)
    const isBust = oldScore === newScore && oldScore !== 501 && newDarts > oldDarts && newDarts > 0;
    if (isBust) {
        console.log(`Bust detected for player ${playerIndex + 1}: score=${newScore}, darts ${oldDarts}->${newDarts}`);
        triggerBustAnimation(playerIndex);
    }

    if (oldScore !== newScore && oldScore !== 501 && oldScore !== undefined) {
        scoreElement.classList.remove('update-flash');
        void scoreElement.offsetWidth;
        scoreElement.classList.add('update-flash');
    }

    lastScores[playerIndex] = newScore;
    lastDartsThrown[playerIndex] = newDarts;
}

/**
 * Update active player indicator
 */
function updateActiveOrWinnerIndicator(state) {
    const p1Row = document.getElementById('player1-section');
    const p2Row = document.getElementById('player2-section');
    const p1Icon = document.getElementById('p1-active');
    const p2Icon = document.getElementById('p2-active');

    if (state.gameOver && typeof state.winner === 'number') {
        const winnerIndex = state.winner;
        // Mark winner row and show trophy
        if (winnerIndex === 0) {
            p1Row.classList.add('winner');
            p2Row.classList.remove('winner');
            p1Row.classList.remove('active');
            p2Row.classList.remove('active');
            p1Icon.textContent = '🏆';
            p2Icon.textContent = '';
        } else {
            p2Row.classList.add('winner');
            p1Row.classList.remove('winner');
            p1Row.classList.remove('active');
            p2Row.classList.remove('active');
            p2Icon.textContent = '🏆';
            p1Icon.textContent = '';
        }
    } else {
        // Normal active dart display
        p1Row.classList.remove('winner');
        p2Row.classList.remove('winner');
        if (gameState.players[0].isActive) {
            p1Row.classList.add('active');
            p2Row.classList.remove('active');
            p1Icon.textContent = '🎯';
            p2Icon.textContent = '🎯';
        } else {
            p1Row.classList.remove('active');
            p2Row.classList.add('active');
            p1Icon.textContent = '🎯';
            p2Icon.textContent = '🎯';
        }
    }
}

/**
 * Trophy animation at the legs column for leg wins
 */
function triggerLegTrophyAnimation(winnerIndex, prevLegs, newLegs) {
    try {
        const legsEl = document.getElementById(`p${winnerIndex + 1}-legs`);
        const container = document.querySelector('.overlay-container');
        if (!legsEl || !container) return;

        // Position overlay relative to legs element
        const rect = legsEl.getBoundingClientRect();
        const crect = container.getBoundingClientRect();
        const x = rect.left - crect.left + rect.width / 2;
        const y = rect.top - crect.top + rect.height / 2;

        // Create trophy pop element
        const pop = document.createElement('div');
        pop.className = 'trophy-pop';
        pop.innerHTML = `<span class="trophy">🏆</span><span class="trophy-count">${newLegs}</span>`;
        pop.style.left = `${x}px`;
        pop.style.top = `${y}px`;

        container.appendChild(pop);

        // Ensure starting transform
        void pop.offsetWidth;
        pop.classList.add('show');

        // Keep legs text at previous value until animation completes
        legsEl.textContent = prevLegs;

        // Clear any previous timer
        if (legWinTimer) {
            clearTimeout(legWinTimer);
            legWinTimer = null;
        }

        legWinTimer = setTimeout(() => {
            // Update legs to new value and remove pop
            legsEl.textContent = newLegs;
            pop.classList.remove('show');
            pop.classList.add('hide');
            setTimeout(() => {
                pop.remove();
            }, 250);
            pendingLegUpdate = null;
            legWinTimer = null;
        }, 900);
    } catch (err) {
        console.warn('Leg trophy animation failed:', err);
    }
}

/**
 * Trigger bust explosion animation
 */
function triggerBustAnimation(playerIndex) {
    try {
        const scoreElement = document.getElementById(`p${playerIndex + 1}-score`);
        if (!scoreElement) return;

        const rect = scoreElement.getBoundingClientRect();
        const containerRect = scoreElement.parentElement.getBoundingClientRect();
        
        const pop = document.createElement('div');
        pop.className = 'bust-pop';
        pop.textContent = '💥';
        
        // Position absolutely relative to viewport, then convert to parent-relative
        const relativeLeft = rect.left - containerRect.left + rect.width / 2;
        const relativeTop = rect.top - containerRect.top + rect.height / 2;
        
        pop.style.left = `${relativeLeft}px`;
        pop.style.top = `${relativeTop}px`;

        const container = scoreElement.parentElement;
        container.style.position = 'relative';
        container.appendChild(pop);

        // Hide score while burst is showing
        scoreElement.style.visibility = 'hidden';

        console.log(`Bust animation triggered for player ${playerIndex + 1} at (${relativeLeft}, ${relativeTop})`);

        // Ensure starting transform
        void pop.offsetWidth;
        pop.classList.add('show');

        // Clear any previous timer
        if (bustTimer) {
            clearTimeout(bustTimer);
            bustTimer = null;
        }

        // Keep burst visible for 2500ms (same as toast), then fade for 200ms
        bustTimer = setTimeout(() => {
            // Remove burst pop and show score again
            pop.classList.remove('show');
            pop.classList.add('hide');
            setTimeout(() => {
                pop.remove();
                scoreElement.style.visibility = 'visible';
            }, 200);
            bustTimer = null;
        }, 2500);
    } catch (err) {
        console.warn('Bust animation failed:', err);
    }
}

/**
 * Update checkout suggestion based on remaining score
 */
function updateCheckoutSuggestion(playerIndex) {
    const score = gameState.players[playerIndex].score;
    const checkoutElement = document.getElementById(`p${playerIndex + 1}-checkout`);
    if (!checkoutElement) return;

    const checkouts = {
        2: 'D1', 3: 'S1, D1', 4: 'D2', 5: 'S1, D2', 6: 'D3', 7: 'S1, D3', 8: 'D4', 9: 'S1, D4', 10: 'D5',
        11: 'S1, D5', 12: 'D6', 13: 'S1, D6', 14: 'D7', 15: 'S1, D7', 16: 'D8', 17: 'S1, D8', 18: 'D9', 19: 'S1, D9', 20: 'D10',
        21: 'S1, D10', 22: 'D11', 23: 'S1, D11', 24: 'D12', 25: 'S1, D12', 26: 'D13', 27: 'S1, D13', 28: 'D14', 29: 'S1, D14', 30: 'D15',
        31: 'S1, D15', 32: 'D16', 33: 'S1, D16', 34: 'D17', 35: 'S1, D17', 36: 'D18', 37: 'S1, D18', 38: 'D19', 39: 'S1, D19', 40: 'D20',
        41: 'S1, D20', 42: 'T14', 43: 'T15, D4', 44: 'D20, D2', 45: 'T15', 46: 'S10, D18', 47: 'T17, D1', 48: 'S8, D20', 49: 'T19, D1', 50: 'D25',
        51: 'T17', 52: 'T16, D2', 53: 'T19, D2', 54: 'T16, D3', 55: 'T15, D10', 56: 'T18, D2', 57: 'T19', 58: 'T16, D5', 59: 'T13, D10', 60: 'T20',
    };

    if (score <= 2 || score > 501) {
        checkoutElement.textContent = '—';
    } else if (checkouts[score]) {
        checkoutElement.textContent = checkouts[score];
    } else {
        checkoutElement.textContent = '—';
    }
}

/**
 * Update game heading to show game type and first-to
 */
function updateGameHeading() {
    const headingEl = getEl('game-heading');
    if (!headingEl) return;

    const startScore = gameState.startScore || 501;
    const firstTo = gameState.firstTo || 1;
    const headingText = firstTo === 1
        ? `${startScore} - 1 leggur til sigurs`
        : `${startScore} - ${firstTo} leggir til sigurs`;
    setTextIfChanged(headingEl, headingText);
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
    // Display room ID
    const roomIdElement = getEl('overlay-room-id');
    if (roomIdElement) {
        setTextIfChanged(roomIdElement, currentRoomId);
    }
    
    applyObsMode();
    setInitialWindowSize();
    initWebSocket();
});
