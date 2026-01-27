/**
 * Game State Management
 * Manages local client-side game state, room IDs, WebSocket connection
 * Pure data management - no DOM manipulation here
 */

// Room and connection state
let currentRoomId = null;
let ws = null;

// Local game state
let gameState = {
    players: [
        { name: 'Leikmaður 1', score: 501, legs: 0, sets: 0, isActive: true },
        { name: 'Leikmaður 2', score: 501, legs: 0, sets: 0, isActive: false }
    ],
    firstTo: 3,
    startScore: 501,
    gameOver: false,
    winner: null
};

// Current round state
let currentDarts = [];      // Array of { value, multiplier }
let currentMultiplier = 1;  // 1 (single), 2 (double), 3 (triple)
let roundHistory = {
    0: [],                  // Player 1 scores
    1: []                   // Player 2 scores
};
let pendingUndoRound = false;

// Checkout suggestions table
const checkouts = {
    2: 'D1', 3: 'S1, D1', 4: 'D2', 5: 'S1, D2', 6: 'D3', 7: 'S1, D3', 8: 'D4', 9: 'S1, D4', 10: 'D5',
    11: 'S1, D5', 12: 'D6', 13: 'S1, D6', 14: 'D7', 15: 'S1, D7', 16: 'D8', 17: 'S1, D8', 18: 'D9', 19: 'S1, D9', 20: 'D10',
    21: 'S1, D10', 22: 'D11', 23: 'S1, D11', 24: 'D12', 25: 'S1, D12', 26: 'D13', 27: 'S1, D13', 28: 'D14', 29: 'S1, D14', 30: 'D15',
    31: 'S1, D15', 32: 'D16', 33: 'S1, D16', 34: 'D17', 35: 'S1, D17', 36: 'D18', 37: 'S1, D18', 38: 'D19', 39: 'S1, D19', 40: 'D20',
    41: 'S1, D20', 42: 'T14, D0', 43: 'T15, D4', 44: 'D20, D2', 45: 'T15, D0', 46: 'S10, D18', 47: 'T17, D1', 48: 'S8, D20', 49: 'T19, D1', 50: 'D25',
    51: 'T17', 52: 'T16, D2', 53: 'T19, D2', 54: 'T16, D3', 55: 'T15, D10', 56: 'T18, D2', 57: 'T19', 58: 'T16, D5', 59: 'T13, D10', 60: 'T20',
    61: 'T19, D2', 62: 'T20, S1', 63: 'T19, D3', 64: 'T16, D16', 65: 'T15, D10', 66: 'T20, D3', 67: 'T17, D8', 68: 'T20, D4', 69: 'T19, D6', 70: 'T20, D5',
    71: 'T19, D7', 72: 'T20, D6', 73: 'T19, D8', 74: 'T20, D7', 75: 'T25', 76: 'T20, D8', 77: 'T19, D10', 78: 'T20, D9', 79: 'T19, D11', 80: 'T20, D10',
    81: 'T19, D12', 82: 'T20, D11', 83: 'T19, D13', 84: 'T20, D12', 85: 'T15, D20', 86: 'T20, D13', 87: 'T19, D15', 88: 'T20, D14', 89: 'T19, D16', 90: 'T20, D15',
    91: 'T19, D17', 92: 'T20, D16', 93: 'T19, D18', 94: 'T20, D17', 95: 'T19, D19', 96: 'T20, D18', 97: 'T19, D20', 98: 'T20, D19', 99: 'T17, D25', 100: 'T20, D20',
    101: 'T20, T19, D2', 102: 'T20, T20, D1', 103: 'T19, T16, D8', 104: 'T20, T18, D5', 105: 'T15, T20, D0', 106: 'T20, T18, D8', 107: 'T19, T18, D7', 108: 'T20, T16, D10', 109: 'T19, T18, D10', 110: 'T20, D25',
    111: 'T19, T18, D12', 112: 'T20, T16, D14', 113: 'T19, T18, D14', 114: 'T20, T18, D14', 115: 'T19, T18, D16', 116: 'T20, T18, D16', 117: 'T19, T20, D10', 118: 'T20, T18, D18', 119: 'T17, T20, D11', 120: 'T20, D20',
    121: 'T20, T19, D2', 122: 'T20, T20, D1', 123: 'T19, T18, D15', 124: 'T20, T18, D17', 125: 'T19, T18, D17', 126: 'T20, T18, D19', 127: 'T20, T9, D20', 128: 'T20, T20, D14', 129: 'T19, T20, D15', 130: 'T20, D25',
    131: 'T19, T20, D16', 132: 'T20, T20, D16', 133: 'T19, T20, D17', 134: 'T20, T20, D17', 135: 'T19, T20, D18', 136: 'T20, T20, D18', 137: 'T19, T20, D19', 138: 'T20, T20, D19', 139: 'T17, T20, D20', 140: 'T20, D20',
    141: 'T19, T20, D2', 142: 'T20, T20, D1', 143: 'T19, T18, D25', 144: 'T20, T18, D24', 145: 'T19, T20, D3', 146: 'T20, T20, D3', 147: 'T19, T20, D4', 148: 'T20, T20, D4', 149: 'T19, T20, D5', 150: 'T20, D25',
    151: 'T19, T20, D6', 152: 'T20, T20, D6', 153: 'T19, T20, D7', 154: 'T20, T20, D7', 155: 'T19, T20, D8', 156: 'T20, T20, D8', 157: 'T19, T20, D9', 158: 'T20, T20, D9', 159: 'T19, T20, D10', 160: 'T20, D20',
    161: 'T19, T20, D11', 162: 'T20, T20, D11', 163: 'T19, T20, D12', 164: 'T20, T20, D12', 165: 'T19, T20, D13', 166: 'T20, T20, D13', 167: 'T19, T20, D14', 168: 'T20, T20, D14', 169: 'T19, T20, D15', 170: 'T20, D25'
};

// ===== INITIALIZATION =====

/**
 * Generate random 6-character room ID
 */
function generateRoomId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Get WebSocket URL based on current browser location
 */
function getWebSocketURL() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host || 'localhost:8080';
    if (window.location.protocol === 'file:') {
        return 'ws://localhost:8080';
    }
    return `${protocol}//${host}`;
}

/**
 * Initialize room ID (called once on page load)
 */
function initRoomId() {
    if (!currentRoomId) {
        // Try to load from localStorage
        currentRoomId = localStorage.getItem('darts_roomId');
        if (!currentRoomId) {
            // Generate new if not in localStorage
            currentRoomId = generateRoomId();
        }
        // Save to localStorage
        localStorage.setItem('darts_roomId', currentRoomId);
    }
    return currentRoomId;
}

/**
 * Save room ID to localStorage
 */
function saveRoomIdToStorage(roomId) {
    localStorage.setItem('darts_roomId', roomId);
    currentRoomId = roomId;
}

/**
 * Clear room ID from localStorage (for new game)
 */
function clearRoomIdFromStorage() {
    localStorage.removeItem('darts_roomId');
}

// ===== CURRENT ROUND STATE MANAGEMENT =====

/**
 * Add dart to current round
 */
function addDartToRound(value, multiplier = currentMultiplier) {
    if (currentDarts.length >= 3) {
        return false;
    }
    
    currentDarts.push({ value, multiplier });
    return true;
}

/**
 * Remove last dart from current round
 */
function removeLastDart() {
    if (currentDarts.length > 0) {
        currentDarts.pop();
        return true;
    }
    return false;
}

/**
 * Get current round dart count
 */
function getCurrentDartCount() {
    return currentDarts.length;
}

/**
 * Get current round total score
 */
function getCurrentRoundScore() {
    let total = 0;
    currentDarts.forEach(dart => {
        total += dart.value * dart.multiplier;
    });
    return total;
}

/**
 * Reset current round UI state
 */
function resetCurrentRound() {
    currentDarts = [];
    currentMultiplier = 1;
}

/**
 * Set current multiplier
 */
function setCurrentMultiplier(mult) {
    currentMultiplier = mult;
}

/**
 * Get current multiplier
 */
function getCurrentMultiplier() {
    return currentMultiplier;
}

/**
 * Toggle multiplier (if same, return to 1)
 */
function toggleMultiplier(mult) {
    if (currentMultiplier === mult) {
        currentMultiplier = 1;
    } else {
        currentMultiplier = mult;
    }
    return currentMultiplier;
}

// ===== GAME STATE MANAGEMENT =====

/**
 * Get active player index
 */
function getActivePlayerIndex() {
    return gameState.players[0].isActive ? 0 : 1;
}

/**
 * Get active player
 */
function getActivePlayer() {
    const idx = getActivePlayerIndex();
    return gameState.players[idx];
}

/**
 * Update game state from server
 */
function updateGameState(newState) {
    gameState = newState;
}

/**
 * Get checkout suggestion for score
 */
function getCheckoutSuggestion(remainingScore) {
    return checkouts[remainingScore] || null;
}

/**
 * Add score to round history
 */
function addScoreToHistory(playerIndex, score) {
    if (roundHistory[playerIndex]) {
        roundHistory[playerIndex].push(score);
    }
}

/**
 * Remove last score from round history
 */
function removeLastScoreFromHistory(playerIndex) {
    if (roundHistory[playerIndex] && roundHistory[playerIndex].length > 0) {
        roundHistory[playerIndex].pop();
        return true;
    }
    return false;
}

/**
 * Get round history for player
 */
function getRoundHistory(playerIndex) {
    return roundHistory[playerIndex] || [];
}

/**
 * Reset round history
 */
function resetRoundHistory() {
    roundHistory = {
        0: [],
        1: []
    };
}

// ===== WEBSOCKET STATE =====

/**
 * Set WebSocket connection
 */
function setWebSocket(wsConnection) {
    ws = wsConnection;
}

/**
 * Get WebSocket connection
 */
function getWebSocket() {
    return ws;
}

/**
 * Check if connected
 */
function isConnected() {
    return ws && ws.readyState === WebSocket.OPEN;
}

// ===== UNDO STATE =====

/**
 * Set pending undo round flag
 */
function setPendingUndoRound(value) {
    pendingUndoRound = value;
}

/**
 * Get pending undo round flag
 */
function getPendingUndoRound() {
    return pendingUndoRound;
}

// ===== EXPORTS (for testing and modular use) =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // Initialization
        initRoomId,
        getWebSocketURL,
        generateRoomId,
        
        // Current round
        addDartToRound,
        removeLastDart,
        getCurrentDartCount,
        getCurrentRoundScore,
        resetCurrentRound,
        setCurrentMultiplier,
        getCurrentMultiplier,
        toggleMultiplier,
        
        // Game state
        getActivePlayerIndex,
        getActivePlayer,
        updateGameState,
        getCheckoutSuggestion,
        
        // History
        addScoreToHistory,
        removeLastScoreFromHistory,
        getRoundHistory,
        resetRoundHistory,
        
        // WebSocket
        setWebSocket,
        getWebSocket,
        isConnected,
        
        // Undo state
        setPendingUndoRound,
        getPendingUndoRound,
        
        // State objects (for access where needed)
        get currentRoomId() { return currentRoomId; },
        set currentRoomId(val) { currentRoomId = val; },
        get gameState() { return gameState; },
        get currentDarts() { return currentDarts; },
        get roundHistory() { return roundHistory; }
    };
}
