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
let lastScores = [];
let lastDartsThrown = [];
let lastRenderedPlayerCount = 0;
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

function clearPlayerElementCache(playerCount) {
    for (let i = 1; i <= playerCount; i++) {
        delete elementCache[`player${i}-section`];
        delete elementCache[`p${i}-active`];
        delete elementCache[`p${i}-name`];
        delete elementCache[`p${i}-avg`];
        delete elementCache[`p${i}-legs`];
        delete elementCache[`p${i}-score`];
        delete elementCache[`p${i}-darts`];
        delete elementCache[`p${i}-checkout`];
    }
}

function renderPlayerRows() {
    const container = document.getElementById('player-rows');
    if (!container || !gameState || !gameState.players) return;

    const playerCount = gameState.players.length;
    if (container.children.length === playerCount && lastRenderedPlayerCount === playerCount) {
        return;
    }

    clearPlayerElementCache(Math.max(playerCount, lastRenderedPlayerCount));
    container.innerHTML = '';

    gameState.players.forEach((player, index) => {
        const row = document.createElement('div');
        row.className = `player-row player-${index + 1}`;
        row.id = `player${index + 1}-section`;
        row.innerHTML = `
            <div class="col col-name"><span class="active-indicator" id="p${index + 1}-active">🎯</span><span class="player-name" id="p${index + 1}-name">${player.name}</span></div>
            <div class="col col-avg"><span id="p${index + 1}-avg">0.0</span></div>
            <div class="col col-legs"><span id="p${index + 1}-legs">0</span></div>
            <div class="col col-score"><span id="p${index + 1}-score">${player.score}</span> <span class="darts-count" id="p${index + 1}-darts">(0)</span></div>
        `;
        container.appendChild(row);
    });

    lastRenderedPlayerCount = playerCount;
    lastScores = new Array(playerCount).fill(undefined);
    lastDartsThrown = new Array(playerCount).fill(0);
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

    renderPlayerRows();

    // Update player names, scores, averages, and legs
    gameState.players.forEach((player, index) => {
        setTextIfChanged(getEl(`p${index + 1}-name`), player.name);
        updateScoreDisplay(index);
        setTextIfChanged(getEl(`p${index + 1}-avg`), (player.average || 0).toFixed(1));

        const legsEl = getEl(`p${index + 1}-legs`);
        if (pendingLegUpdate && pendingLegUpdate.index === index) {
            setTextIfChanged(legsEl, pendingLegUpdate.prevLegs);
        } else {
            setTextIfChanged(legsEl, player.legs);
        }
    });

    // Update active/trophy indicator
    updateActiveOrWinnerIndicator(newState);

    // Update checkout suggestions
    gameState.players.forEach((_, index) => updateCheckoutSuggestion(index));

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
    if (!state || !state.players) return;

    const rows = state.players.map((_, index) => document.getElementById(`player${index + 1}-section`));
    const icons = state.players.map((_, index) => document.getElementById(`p${index + 1}-active`));

    if (state.gameOver && typeof state.winner === 'number') {
        const winnerIndex = state.winner;
        rows.forEach((row, index) => {
            if (!row) return;
            if (index === winnerIndex) {
                row.classList.add('winner');
                row.classList.remove('active');
            } else {
                row.classList.remove('winner');
                row.classList.remove('active');
            }
        });
        icons.forEach((icon, index) => {
            if (!icon) return;
            icon.textContent = index === winnerIndex ? '🏆' : '';
        });
    } else {
        rows.forEach((row, index) => {
            if (!row) return;
            if (state.players[index].isActive) {
                row.classList.add('active');
            } else {
                row.classList.remove('active');
            }
            row.classList.remove('winner');
        });
        icons.forEach((icon, index) => {
            if (!icon) return;
            icon.textContent = state.players[index].isActive ? '🎯' : '';
        });
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
            window.resizeTo(700, 500);
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
