// WebSocket URL detection
function getWebSocketURL() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host || 'localhost:8080';
    if (window.location.protocol === 'file:') {
        return 'ws://localhost:8080';
    }
    return `${protocol}//${host}`;
}

// Generate random 6-character room ID
function generateRoomId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Room ID for this game session
let currentRoomId = generateRoomId();

// Checkout suggestions table (all legal finishes from 2-170)
// In darts, checkout MUST end with a double (D)
// Valid darts: S1-S20, D1-D20 (40 max), T1-T20, S25 (Bull), D25 (50)
const checkouts = {
    // 2-20: Simple doubles
    2: 'D1', 3: 'S1, D1', 4: 'D2', 5: 'S1, D2', 6: 'D3', 7: 'S1, D3', 8: 'D4', 9: 'S1, D4', 10: 'D5',
    11: 'S1, D5', 12: 'D6', 13: 'S1, D6', 14: 'D7', 15: 'S1, D7', 16: 'D8', 17: 'S1, D8', 18: 'D9', 19: 'S1, D9', 20: 'D10',
    
    // 21-40: Doubles with singles or better finishes
    21: 'S1, D10', 22: 'D11', 23: 'S1, D11', 24: 'D12', 25: 'S1, D12', 26: 'D13', 27: 'S1, D13', 28: 'D14', 29: 'S1, D14', 30: 'D15',
    31: 'S1, D15', 32: 'D16', 33: 'S1, D16', 34: 'D17', 35: 'S1, D17', 36: 'D18', 37: 'S1, D18', 38: 'D19', 39: 'S1, D19', 40: 'D20',
    
    // 41-60: Triple combinations
    41: 'S1, D20', 42: 'T14, D0', 43: 'T15, D4', 44: 'D20, D2', 45: 'T15, D0', 46: 'S10, D18', 47: 'T17, D1', 48: 'S8, D20', 49: 'T19, D1', 50: 'D25',
    51: 'T17', 52: 'T16, D2', 53: 'T19, D2', 54: 'T16, D3', 55: 'T15, D10', 56: 'T18, D2', 57: 'T19', 58: 'T16, D5', 59: 'T13, D10', 60: 'T20',
    
    // 61-80: Good finishing options
    61: 'T19, D2', 62: 'T20, S1', 63: 'T19, D3', 64: 'T16, D16', 65: 'T15, D10', 66: 'T20, D3', 67: 'T17, D8', 68: 'T20, D4', 69: 'T19, D6', 70: 'T20, D5',
    71: 'T19, D7', 72: 'T20, D6', 73: 'T19, D8', 74: 'T20, D7', 75: 'T25', 76: 'T20, D8', 77: 'T19, D10', 78: 'T20, D9', 79: 'T19, D11', 80: 'T20, D10',
    
    // 81-100: Higher scores
    81: 'T19, D12', 82: 'T20, D11', 83: 'T19, D13', 84: 'T20, D12', 85: 'T15, D20', 86: 'T20, D13', 87: 'T19, D15', 88: 'T20, D14', 89: 'T19, D16', 90: 'T20, D15',
    91: 'T19, D17', 92: 'T20, D16', 93: 'T19, D18', 94: 'T20, D17', 95: 'T19, D19', 96: 'T20, D18', 97: 'T19, D20', 98: 'T20, D19', 99: 'T17, D25', 100: 'T20, D20',
    
    // 101-120: Building up to finish (3 darts with VALID doubles only)
    101: 'T20, T19, D2', 102: 'T20, T20, D1', 103: 'T19, T16, D8', 104: 'T20, T18, D5', 105: 'T15, T20, D0', 106: 'T20, T18, D8', 107: 'T19, T18, D7', 108: 'T20, T16, D10', 109: 'T19, T18, D10', 110: 'T20, D25',
    111: 'T19, T18, D12', 112: 'T20, T16, D14', 113: 'T19, T18, D14', 114: 'T20, T18, D14', 115: 'T19, T18, D16', 116: 'T20, T18, D16', 117: 'T19, T20, D10', 118: 'T20, T18, D18', 119: 'T17, T20, D11', 120: 'T20, D20',
    
    // 121-140: Higher three dart finishes (VALID only)
    121: 'T20, T19, D2', 122: 'T20, T20, D1', 123: 'T19, T18, D15', 124: 'T20, T18, D17', 125: 'T19, T18, D17', 126: 'T20, T18, D19', 127: 'T20, T9, D20', 128: 'T20, T20, D14', 129: 'T19, T20, D15', 130: 'T20, D25',
    131: 'T19, T20, D16', 132: 'T20, T20, D16', 133: 'T19, T20, D17', 134: 'T20, T20, D17', 135: 'T19, T20, D18', 136: 'T20, T20, D18', 137: 'T19, T20, D19', 138: 'T20, T20, D19', 139: 'T17, T20, D20', 140: 'T20, D20',
    
    // 141-160: Maximum three dart combinations (VALID only)
    141: 'T19, T20, D2', 142: 'T20, T20, D1', 143: 'T19, T18, D25', 144: 'T20, T18, D24', 145: 'T19, T20, D3', 146: 'T20, T20, D3', 147: 'T19, T20, D4', 148: 'T20, T20, D4', 149: 'T19, T20, D5', 150: 'T20, D25',
    151: 'T19, T20, D6', 152: 'T20, T20, D6', 153: 'T19, T20, D7', 154: 'T20, T20, D7', 155: 'T19, T20, D8', 156: 'T20, T20, D8', 157: 'T19, T20, D9', 158: 'T20, T20, D9', 159: 'T19, T20, D10', 160: 'T20, D20',
    
    // 161-170: Maximum possible finishes (VALID only)
    161: 'T19, T20, D11', 162: 'T20, T20, D11', 163: 'T19, T20, D12', 164: 'T20, T20, D12', 165: 'T19, T20, D13', 166: 'T20, T20, D13', 167: 'T19, T20, D14', 168: 'T20, T20, D14', 169: 'T19, T20, D15', 170: 'T20, D25'
};

const WS_URL = getWebSocketURL();

let gameState = {
    players: [
        { name: 'Leikmaður 1', score: 501, legs: 0, sets: 0, isActive: true },
        { name: 'Leikmaður 2', score: 501, legs: 0, sets: 0, isActive: false }
    ],
    firstTo: 3,
    gameOver: false,
    winner: null
};

let ws;
let currentDarts = []; // Array of { value, multiplier }
let currentMultiplier = 1; // 1 (single), 2 (double), 3 (triple)
let roundHistory = {
    0: [], // Player 1 scores
    1: []  // Player 2 scores
};
let pendingUndoRound = false;

function resetCurrentRoundUI() {
    currentDarts = [];
    currentMultiplier = 1;
    document.getElementById('dart-1').innerHTML = 'PÍLA 1';
    document.getElementById('dart-2').innerHTML = 'PÍLA 2';
    document.getElementById('dart-3').innerHTML = 'PÍLA 3';
    
    // Clear bust status from all dart labels
    for (let i = 1; i <= 3; i++) {
        const dartLabel = document.getElementById(`dart-${i}`);
        if (dartLabel) {
            dartLabel.classList.remove('bust', 'active');
        }
    }
    
    updateModifierDisplay();
    updateUI();
}

// Show toast notification
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// Show leg win modal
function showLegWinModal(message, isGameWin, legWinnerIndex) {
    const modal = document.getElementById('legWinModal');
    const text = document.getElementById('legWinText');
    const button = document.getElementById('nextLegBtn');
    
    // Build detailed message
    if (legWinnerIndex !== undefined) {
        const winner = gameState.players[legWinnerIndex];
        const p1Legs = gameState.players[0].legs;
        const p2Legs = gameState.players[1].legs;
        
        if (isGameWin) {
            // Match won
            text.innerHTML = `🎉 ${winner.name} vann leikinn! 🎉<br>${p1Legs} - ${p2Legs}`;
            button.textContent = 'Nýr leikur';
            button.onclick = resetGameForNewMatch;
        } else {
            // Leg won, match continues
            text.innerHTML = `${winner.name} vann legginn!<br>${p1Legs} - ${p2Legs}<br>(Fyrsti til að vinna ${gameState.firstTo})`;
            button.textContent = 'Næsti Leggur';
            button.onclick = hideLegWinModal;
        }
    } else {
        text.textContent = message;
        button.textContent = 'Næsti Leggur';
        button.onclick = hideLegWinModal;
    }
    
    modal.classList.add('show');
}

// Hide leg win modal and reset board for next leg
function hideLegWinModal() {
    const modal = document.getElementById('legWinModal');
    modal.classList.remove('show');
    resetForNextLeg();
}

// Reset UI for next leg without showing modal
function resetForNextLeg() {
    currentDarts = [];
    currentMultiplier = 1;

    document.getElementById('dart-1').innerHTML = 'PÍLA 1';
    document.getElementById('dart-2').innerHTML = 'PÍLA 2';
    document.getElementById('dart-3').innerHTML = 'PÍLA 3';

    document.getElementById('checkout-suggestion').textContent = '—';

    updateUI();
}

// Game win options modal
function showGameWinOptions(winnerName) {
    const modal = document.getElementById('gameWinOptionsModal');
    const text = document.getElementById('gameWinOptionsText');
    if (!modal || !text) return;
    text.textContent = `${winnerName} vann leikinn!`;
    modal.classList.add('show');
}

function hideGameWinOptions() {
    const modal = document.getElementById('gameWinOptionsModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function handleRematchFromWinModal() {
    hideGameWinOptions();
    resetForNextLeg();
    roundHistory = { 0: [], 1: [] };
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resetGame', roomId: currentRoomId }));
    }
}

function openNewGameModalWithCurrentSettings() {
    document.getElementById('p1-name-input').value = gameState.players[0].name || 'Leikmaður 1';
    document.getElementById('p2-name-input').value = gameState.players[1].name || 'Leikmaður 2';
    document.getElementById('first-to-input').value = gameState.firstTo || 3;
    document.querySelector(`input[name="game-type"][value="${gameState.startScore || 501}"]`).checked = true;
    document.getElementById('new-game-modal').classList.add('active');
}

// Reset game for new match
function resetGameForNewMatch() {
    hideLegWinModal();
    
    // Reset round history
    roundHistory = {
        0: [],
        1: []
    };
    
    // Open the new game modal to set up next match
    document.getElementById('p1-name-input').value = gameState.players[0].name || 'Leikmaður 1';
    document.getElementById('p2-name-input').value = gameState.players[1].name || 'Leikmaður 2';
    document.getElementById('first-to-input').value = 3; // Always default to 3
    document.querySelector('input[name="game-type"][value="501"]').checked = true;
    document.getElementById('new-game-modal').classList.add('active');
}

// Show bust modal
function showBustModal(currentScore, scoreThrown) {
    const modal = document.getElementById('bustModal');
    const message = document.getElementById('bustMessage');
    const playerNameElement = document.getElementById('bustPlayerName');
    const newScore = currentScore - scoreThrown;
    
    // Get active player name
    const activePlayer = gameState.players[0].isActive ? gameState.players[0] : gameState.players[1];
    playerNameElement.textContent = activePlayer.name;
    
    if (newScore === 1) {
        message.textContent = `Skor: ${currentScore} − ${scoreThrown} = 1`;
    } else {
        message.textContent = `Skor: ${currentScore} − ${scoreThrown} = ${newScore}`;
    }
    
    modal.classList.add('show');
}

// Hide bust modal and reset darts
function hideBustModal() {
    const modal = document.getElementById('bustModal');
    modal.classList.remove('show');
    resetCurrentRoundUI();
}

// Open overlay in new window
function openOverlay() {
    const width = 1920;
    const height = 1080;
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;
    
    window.open(`/overlay/overlay.html?room=${currentRoomId}`, 'overlay', 
        `width=${width},height=${height},left=${left},top=${top},resizable=yes`);
    
    showToast('Overlay opnað!');
}

// Close settings without saving
function closeSettings() {
    document.getElementById('settings-section').classList.remove('active');
    // Reset inputs to current values
    syncInputsWithGameState();
}

// Save settings and send to dashboard
function saveSettings() {
    // The WebSocket sends already happen on input change
    // Just close the settings section
    document.getElementById('settings-section').classList.remove('active');
    showToast('Stillingar vistaðar!');
}

// Sync input values with current game state
function syncInputsWithGameState() {
    document.getElementById('p1-name-input').value = gameState.players[0].name;
    document.getElementById('p2-name-input').value = gameState.players[1].name;
    document.getElementById('first-to-input').value = gameState.firstTo;
}

// Initialize WebSocket
function initWebSocket() {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        console.log('Connected to server, joining room:', currentRoomId);
        // Join room immediately upon connection
        ws.send(JSON.stringify({ 
            type: 'join',
            roomId: currentRoomId
        }));
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'stateUpdate') {
            const previousActivePlayer = gameState.players ? (gameState.players[0].isActive ? 0 : 1) : null;
            const previousGameState = gameState;
            gameState = message.data;
            const currentActivePlayer = gameState.players[0].isActive ? 0 : 1;
            
            console.log('=== STATE UPDATE ===');
            console.log('Previous active player:', previousActivePlayer);
            console.log('Current active player:', currentActivePlayer);
            console.log('Current darts length:', currentDarts.length);
            console.log('Player 0 - Score:', gameState.players[0].score, 'Darts:', gameState.players[0].dartsThrown, 'Avg:', gameState.players[0].average);
            console.log('Player 1 - Score:', gameState.players[1].score, 'Darts:', gameState.players[1].dartsThrown, 'Avg:', gameState.players[1].average);
            
            // If player changed, clear local darts
            if (previousActivePlayer !== null && previousActivePlayer !== currentActivePlayer) {
                console.log('Player changed! Clearing local darts.');
                if (currentDarts.length > 0) {
                    resetCurrentRoundUI();
                }
            } else {
                console.log('Player did NOT change. Not clearing darts.');
            }
            
            updateUI();
            
            // Check for leg win - use a small delay to ensure UI is updated
            if (message.data.legWin && message.data.legWinner !== undefined) {
                const legWinnerIndex = message.data.legWinner;
                const isGameWin = message.data.gameWin || false;
                
                // Small delay to ensure state is fully synced
                setTimeout(() => {
                    // Trigger animation in control panel
                    if (isGameWin) {
                        triggerWinAnimation();
                    } else {
                        triggerLegWinAnimation(legWinnerIndex, true);
                    }
                }, 100);
            }
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
        console.log('Disconnected, retrying...');
        setTimeout(initWebSocket, 2000);
    };
}

// Update UI display
function updateUI() {
    // Calculate round score for current darts
    let roundScore = 0;
    currentDarts.forEach(dart => {
        roundScore += dart.value * dart.multiplier;
    });
    
    // Update player scores - show projected score for active player
    const activePlayerIndex = gameState.players[0].isActive ? 0 : 1;
    const inactivePlayerIndex = 1 - activePlayerIndex;
    
    // Active player shows current score minus darts thrown this round
    const projectedScore = gameState.players[activePlayerIndex].score - roundScore;
    document.getElementById(`p${activePlayerIndex + 1}-score`).textContent = projectedScore;
    
    // Inactive player shows their actual score
    document.getElementById(`p${inactivePlayerIndex + 1}-score`).textContent = gameState.players[inactivePlayerIndex].score;

    // Update player names
    document.getElementById('p1-name').textContent = gameState.players[0].name;
    document.getElementById('p2-name').textContent = gameState.players[1].name;

    // Update active player cards
    const p1Card = document.querySelector('.player-card.player-1');
    const p2Card = document.querySelector('.player-card.player-2');
    
    if (gameState.players[0].isActive) {
        p1Card.classList.add('active');
        p2Card.classList.remove('active');
    } else {
        p1Card.classList.remove('active');
        p2Card.classList.add('active');
    }

    // Calculate current round number (total rounds completed by both players)
    // Each player's round = 3 darts, so total rounds = sum of all rounds from both players
    const totalRoundsCompleted = roundHistory[0].length + roundHistory[1].length;
    const currentRound = totalRoundsCompleted + 1; // Add 1 because we're on the next round
    document.getElementById('round-number').textContent = currentRound;

    // Update checkout suggestion for active player
    updateCheckoutSuggestion();

    // Update P1 average score display
    updateP1AverageDisplay();

    // Update P2 average score display
    updateP2AverageDisplay();

    // Update dart tracker
    updateDartTracker();
    updateModifierDisplay();
}

// Update dart tracker display
function updateDartTracker() {
    document.getElementById('dart-1').classList.toggle('active', currentDarts.length >= 1);
    document.getElementById('dart-2').classList.toggle('active', currentDarts.length >= 2);
    document.getElementById('dart-3').classList.toggle('active', currentDarts.length >= 3);
}

// Update modifier button display and number pad
function updateModifierDisplay() {
    const doubleBtn = document.getElementById('double-btn');
    const tripleBtn = document.getElementById('triple-btn');

    doubleBtn.classList.toggle('active', currentMultiplier === 2);
    tripleBtn.classList.toggle('active', currentMultiplier === 3);

    // Update number buttons text
    updateSpecialButtonAvailability();
    updateNumberPadDisplay();
}

// Update number pad buttons to show prefix
function updateNumberPadDisplay() {
    const prefix = currentMultiplier === 2 ? 'D' : currentMultiplier === 3 ? 'T' : '';
    
    document.querySelectorAll('.num-btn').forEach(btn => {
        const value = parseInt(btn.dataset.value);
        if (value >= 1 && value <= 20) {
            btn.textContent = prefix + value;
        }
    });
}

// Update checkout suggestion for active player
function updateCheckoutSuggestion() {
    const activePlayer = gameState.players[0].isActive ? gameState.players[0] : gameState.players[1];
    const element = document.getElementById('checkout-suggestion');
    
    // Calculate current round score
    let currentRoundScore = 0;
    currentDarts.forEach(dart => {
        currentRoundScore += dart.value * dart.multiplier;
    });
    
    // Display running total of current round
    if (currentRoundScore === 0) {
        element.textContent = '—';
        element.style.color = '#333333';
    } else {
        element.textContent = currentRoundScore;
        element.style.color = '#000000';
    }
}

// Update P1 average score display
function updateP1AverageDisplay() {
    const player = gameState.players[0];
    
    if (player.dartsThrown === 0) {
        document.getElementById('p1-avg').textContent = 'Avg: 0.0 (0)';
        return;
    }
    
    // Use server-provided average and dartsThrown count
    const avg = player.average ? player.average.toFixed(1) : '0.0';
    document.getElementById('p1-avg').textContent = `Avg: ${avg} (${player.dartsThrown})`;
}

// Update P2 average score display
function updateP2AverageDisplay() {
    const player = gameState.players[1];
    
    if (player.dartsThrown === 0) {
        document.getElementById('p2-avg').textContent = 'Avg: 0.0 (0)';
        return;
    }
    
    // Use server-provided average and dartsThrown count
    const avg = player.average ? player.average.toFixed(1) : '0.0';
    document.getElementById('p2-avg').textContent = `Avg: ${avg} (${player.dartsThrown})`;
}

// Update average score
function updateAverageScore() {
    if (roundHistory.length === 0) {
        document.getElementById('avg-score').textContent = '0.0';
        return;
    }
    
    const totalScore = roundHistory.reduce((sum, score) => sum + score, 0);
    const averageScore = totalScore / roundHistory.length;
    document.getElementById('avg-score').textContent = averageScore.toFixed(1);
}

// Check if current darts would result in a bust and update dart tracker colors
function updateDartTrackerBustStatus() {
    const activePlayer = gameState.players[0].isActive ? 0 : 1;
    const playerScore = gameState.players[activePlayer].score;
    
    // Calculate current score thrown
    let totalScore = 0;
    currentDarts.forEach(dart => {
        totalScore += dart.value * dart.multiplier;
    });
    
    const newScore = playerScore - totalScore;
    const isBust = newScore < 0 || newScore === 1;
    
    // Update all dart labels to show bust status
    for (let i = 0; i < currentDarts.length; i++) {
        const dartLabel = document.getElementById(`dart-${i + 1}`);
        if (dartLabel) {
            if (isBust) {
                dartLabel.classList.add('bust');
                dartLabel.classList.remove('active');
            } else {
                dartLabel.classList.remove('bust');
                dartLabel.classList.add('active');
            }
        }
    }
    
    // Enable submit button if bust is detected (player can submit immediately)
    if (isBust && currentDarts.length > 0) {
        const submitBtn = document.getElementById('submit-round-btn');
        submitBtn.disabled = false;
        submitBtn.classList.remove('btn-submit-inactive');
        submitBtn.classList.add('btn-submit-active');
    }
}

// Handle number input (1-20, 25, 50)
function handleNumberInput(value) {
    if (currentDarts.length >= 3) {
        console.log('Umferð búin, bíddu eftir næstu umferð...');
        return;
    }

    const dart = {
        value: value,
        multiplier: currentMultiplier
    };

    currentDarts.push(dart);

    // Enable undo button if first dart is thrown
    if (currentDarts.length === 1) {
        const undoBtn = document.getElementById('undo-dart-btn');
        undoBtn.disabled = false;
        undoBtn.classList.remove('btn-undo-inactive');
        undoBtn.classList.add('btn-undo-active');
    }

    // Display dart score
    const dartScore = value * currentMultiplier;
    const prefix = currentMultiplier === 2 ? 'D' : currentMultiplier === 3 ? 'T' : '';
    const dartLabel = document.getElementById(`dart-${currentDarts.length}`);
    if (dartLabel) {
        dartLabel.innerHTML = `${prefix}${value}`;
    }

    updateUI();

    // Check after each dart if player has reached 0 (won the leg)
    const activePlayer = gameState.players[0].isActive ? 0 : 1;
    const playerScore = gameState.players[activePlayer].score;
    
    let totalScore = 0;
    currentDarts.forEach(dart => {
        totalScore += dart.value * dart.multiplier;
    });
    
    const newScore = playerScore - totalScore;
    
    // Update dart tracker bust status
    updateDartTrackerBustStatus();
    
    // Check if leg is won (score = 0 with double)
    if (newScore === 0) {
        const lastDart = currentDarts[currentDarts.length - 1];
        const finishedOnBull = lastDart.value === 25 || lastDart.value === 50;
        const validDoubleFinish = lastDart.multiplier === 2 || finishedOnBull;
        if (!validDoubleFinish) {
            showToast('Þú verð að enda með double eða bull (25/50)!');
            ws.send(JSON.stringify({
                type: 'bust',
                roomId: currentRoomId,
                playerIndex: activePlayer,
                darts: currentDarts.length
            }));
            resetCurrentRoundUI();
            return;
        }
        // Leg won! Submit immediately
        submitRound();
        return;
    }

    // If 3 darts thrown, enable submit button
    if (currentDarts.length === 3) {
        const submitBtn = document.getElementById('submit-round-btn');
        submitBtn.disabled = false;
        submitBtn.classList.remove('btn-submit-inactive');
        submitBtn.classList.add('btn-submit-active');
    }

    // Reset multiplier for next dart
    currentMultiplier = 1;
    updateModifierDisplay();
}

// Handle miss (0 points)
function handleMiss() {
    if (currentDarts.length >= 3) {
        console.log('Umferð búin, bíddu á nýrri umferð...');
        return;
    }

    const dart = {
        value: 0,
        multiplier: 1
    };

    currentDarts.push(dart);

    const dartLabel = document.getElementById(`dart-${currentDarts.length}`);
    if (dartLabel) {
        dartLabel.innerHTML = `MISS`;
    }

    updateUI();
    
    // Update dart tracker bust status
    updateDartTrackerBustStatus();

    if (currentDarts.length === 3) {
        submitRound();
    }

    currentMultiplier = 1;
    updateModifierDisplay();
}

// Set multiplier (toggle to SINGLE if clicking same button again)
function setMultiplier(mult) {
    if (currentMultiplier === mult) {
        // If clicking same button, toggle back to SINGLE
        currentMultiplier = 1;
    } else {
        // Otherwise set to new multiplier
        currentMultiplier = mult;
    }
    updateModifierDisplay();
    updateSpecialButtonAvailability();
}

// Enable/disable 0, 25, 50 buttons based on multiplier
function updateSpecialButtonAvailability() {
    const btn0 = document.querySelector('[data-value="0"]');
    const btn25 = document.querySelector('[data-value="25"]');
    const btn50 = document.querySelector('[data-value="50"]');
    
    if (!btn0 || !btn25 || !btn50) return;
    
    // 0, 25 are only valid as single (multiplier 1)
    // 50 is always double, so not valid with triple
    const isDouble = currentMultiplier === 2;
    const isTriple = currentMultiplier === 3;
    
    if (isDouble || isTriple) {
        btn0.disabled = true;
        btn0.classList.add('btn-disabled');
        btn25.disabled = true;
        btn25.classList.add('btn-disabled');
        if (isTriple) {
            btn50.disabled = true;
            btn50.classList.add('btn-disabled');
        } else {
            btn50.disabled = false;
            btn50.classList.remove('btn-disabled');
        }
    } else {
        // Single mode - all available
        btn0.disabled = false;
        btn0.classList.remove('btn-disabled');
        btn25.disabled = false;
        btn25.classList.remove('btn-disabled');
        btn50.disabled = false;
        btn50.classList.remove('btn-disabled');
    }
}

// Submit round to server
function submitRound() {
    // Need at least 1 dart to submit
    if (currentDarts.length === 0) {
        return;
    }

    const activePlayer = gameState.players[0].isActive ? 0 : 1;
    const playerScore = gameState.players[activePlayer].score;
    
    // Calculate total score
    let totalScore = 0;
    currentDarts.forEach(dart => {
        totalScore += dart.value * dart.multiplier;
    });

    // Check for bust WHEN SUBMITTING ROUND
    const newScore = playerScore - totalScore;
    if (newScore < 0 || newScore === 1) {
        ws.send(JSON.stringify({
            type: 'bust',
            roomId: currentRoomId,
            playerIndex: activePlayer,
            darts: currentDarts.length
        }));
        showBustModal(playerScore, totalScore);
        resetCurrentRoundUI();
        return;
    }

    // IMPORTANT: Check if finishing a leg (newScore === 0)
    // In darts, you MUST finish with a DOUBLE
    if (newScore === 0) {
        const lastDart = currentDarts[currentDarts.length - 1];
        const finishedOnBull = lastDart.value === 25 || lastDart.value === 50;
        const validDoubleFinish = lastDart.multiplier === 2 || finishedOnBull;
        
        if (!validDoubleFinish) {
            showToast('Þú verð að enda með double eða bull (25/50)!');
            ws.send(JSON.stringify({
                type: 'bust',
                roomId: currentRoomId,
                playerIndex: activePlayer,
                darts: currentDarts.length
            }));
            showBustModal(playerScore, totalScore);
            resetCurrentRoundUI();
            return;
        }
    }

    // Add to round history for this player
    roundHistory[activePlayer].push(totalScore);
    
    // Send to server
    console.log('Sending score:', { playerIndex: activePlayer, value: totalScore, darts: currentDarts.length });
    ws.send(JSON.stringify({
        type: 'score',
        roomId: currentRoomId,
        playerIndex: activePlayer,
        value: totalScore,
        darts: currentDarts.length
    }));

    // Don't reset UI here - let it stay until modal closes or next player starts
    // UI will be updated when server sends stateUpdate
}

// Undo last dart
function undoDart() {
    if (currentDarts.length > 0) {
        // Remove the last dart from current player's round
        currentDarts.pop();
        
        // Clear the dart display for the next dart
        const dartNum = currentDarts.length + 1;
        document.getElementById(`dart-${dartNum}`).innerHTML = `PÍLA ${dartNum}`;
        
        const undoBtn = document.getElementById('undo-dart-btn');
        const submitBtn = document.getElementById('submit-round-btn');
        
        // If we're below 3 darts, disable submit button
        if (currentDarts.length < 3) {
            submitBtn.disabled = true;
            submitBtn.classList.remove('btn-submit-active');
            submitBtn.classList.add('btn-submit-inactive');
        }
        
        // If we're below 1 dart, disable undo button
        if (currentDarts.length < 1) {
            undoBtn.disabled = true;
            undoBtn.classList.remove('btn-undo-active');
            undoBtn.classList.add('btn-undo-inactive');
        } else if (currentDarts.length >= 1 && undoBtn.disabled) {
            // Enable undo button if it was disabled and we have darts
            undoBtn.disabled = false;
            undoBtn.classList.remove('btn-undo-inactive');
            undoBtn.classList.add('btn-undo-active');
        }
        
        // Update UI (scores, checkout suggestion, etc.)
        updateUI();
        
        // Update dart tracker bust status
        updateDartTrackerBustStatus();
        
        // Reset multiplier for next dart
        currentMultiplier = 1;
        updateModifierDisplay();
    } else {
        // No darts in progress - warn before undoing full round
        showUndoRoundModal();
    }
}

// Undo entire round
function undoRound() {
    console.log('=== UNDO ROUND CALLED ===');
    console.log('Current darts before undo:', currentDarts);

    // Remove last recorded round locally so round counter stays in sync
    // The active player is always the next to throw, so the last round belongs to the other player
    const activePlayer = gameState.players[0].isActive ? 0 : 1;
    const lastPlayer = 1 - activePlayer;
    if (roundHistory[lastPlayer] && roundHistory[lastPlayer].length > 0) {
        roundHistory[lastPlayer].pop();
    }
    
    ws.send(JSON.stringify({
        type: 'undo',
        roomId: currentRoomId
    }));

    console.log('Undo message sent to server');
    // Don't clear local state here - wait for server's stateUpdate
    // which will trigger the player change detection and clear it properly
}

function showUndoRoundModal() {
    const modal = document.getElementById('undoRoundModal');
    const message = document.getElementById('undoRoundMessage');
    const activePlayer = gameState.players[0].isActive ? 0 : 1;
    const lastPlayer = 1 - activePlayer;
    const lastPlayerName = gameState.players[lastPlayer]?.name || `Leikmaður ${lastPlayer + 1}`;
    const hasRoundToUndo = roundHistory[lastPlayer] && roundHistory[lastPlayer].length > 0;

    if (!hasRoundToUndo) {
        showToast('Engin heildarumferð til að afturkalla.');
        return;
    }

    message.textContent = `Þú ert að fara að afturkalla heila umferð hjá ${lastPlayerName}.`;
    pendingUndoRound = true;
    modal.classList.add('show');
}

function hideUndoRoundModal() {
    const modal = document.getElementById('undoRoundModal');
    pendingUndoRound = false;
    modal.classList.remove('show');
}

// Reset game
function resetGame() {
    if (confirm('Endurstilla allan leik?')) {
        ws.send(JSON.stringify({
            type: 'resetGame'
        }));
        currentDarts = [];
        currentMultiplier = 1;
        roundHistory = {
            0: [],
            1: []
        };
        updateUI();
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Display room ID
    const roomIdElement = document.getElementById('room-id');
    if (roomIdElement) {
        roomIdElement.textContent = currentRoomId;
    }
    
    initWebSocket();

    // Number pad buttons
    document.querySelectorAll('.num-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            handleNumberInput(parseInt(e.target.dataset.value));
        });
    });

    // Modifier buttons (toggle to SINGLE on second click)
    document.getElementById('double-btn').addEventListener('click', () => setMultiplier(2));
    document.getElementById('triple-btn').addEventListener('click', () => setMultiplier(3));

    // Pad undo arrow behaves same as main undo button
    document.getElementById('undo-pad-btn').addEventListener('click', undoDart);

    // Live overlay button
    document.getElementById('live-indicator').addEventListener('click', openOverlay);

    // Control buttons
    document.getElementById('undo-dart-btn').addEventListener('click', undoDart);
    document.getElementById('submit-round-btn').addEventListener('click', () => {
        const undoBtn = document.getElementById('undo-dart-btn');
        const submitBtn = document.getElementById('submit-round-btn');
        
        // Disable both buttons
        undoBtn.disabled = true;
        undoBtn.classList.remove('btn-undo-active');
        undoBtn.classList.add('btn-undo-inactive');
        
        submitBtn.disabled = true;
        submitBtn.classList.remove('btn-submit-active');
        submitBtn.classList.add('btn-submit-inactive');
        
        submitRound();
    });

    // Bust modal button
    document.getElementById('retryBtn').addEventListener('click', hideBustModal);

    // Undo round modal buttons
    document.getElementById('confirmUndoRoundBtn').addEventListener('click', () => {
        if (pendingUndoRound) {
            hideUndoRoundModal();
            undoRound();
        }
    });

    document.getElementById('cancelUndoRoundBtn').addEventListener('click', hideUndoRoundModal);

    // New Game button
    document.getElementById('new-game-btn').addEventListener('click', openNewGameModalWithCurrentSettings);

    // Game win options modal buttons
    document.getElementById('win-rematch-btn').addEventListener('click', handleRematchFromWinModal);
    document.getElementById('win-newgame-btn').addEventListener('click', () => {
        hideGameWinOptions();
        openNewGameModalWithCurrentSettings();
    });

    document.getElementById('start-new-game-btn').addEventListener('click', startNewGame);

    // Settings inputs
    document.getElementById('p1-name-input').addEventListener('change', (e) => {
        ws.send(JSON.stringify({
            type: 'updateName',
            roomId: currentRoomId,
            playerIndex: 0,
            name: e.target.value
        }));
    });

    document.getElementById('p2-name-input').addEventListener('change', (e) => {
        ws.send(JSON.stringify({
            type: 'updateName',
            roomId: currentRoomId,
            playerIndex: 1,
            name: e.target.value
        }));
    });

    document.getElementById('first-to-input').addEventListener('change', (e) => {
        const newValue = parseInt(e.target.value);
        
        // Check if game is in progress (legs have been played)
        if (gameState.players[0].legs > 0 || gameState.players[1].legs > 0) {
            // Game in progress, don't allow changes
            showToast('Ekki er hægt að breyta þessu á meðan leikur er í gangi!');
            // Reset input to current value
            syncInputsWithGameState();
            return;
        }
        
        ws.send(JSON.stringify({
            type: 'updateFirstTo',
            roomId: currentRoomId,
            value: newValue
        }));
    });

    // Game type selection (501 vs 301)
    document.querySelectorAll('input[name="game-type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            ws.send(JSON.stringify({
                type: 'updateGameType',
                roomId: currentRoomId,
                gameType: parseInt(e.target.value)
            }));
        });
    });

    updateUI();
});

// Keyboard support
document.addEventListener('keydown', (e) => {
    // Ignore hotkeys while typing in inputs or editable elements
    const target = e.target;
    const tag = target && target.tagName ? target.tagName.toLowerCase() : '';
    const isEditable = target && (target.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select');
    if (isEditable) return;

    // Also ignore hotkeys when the New Game modal is open
    const newGameModal = document.getElementById('new-game-modal');
    const isNewGameOpen = newGameModal && newGameModal.classList.contains('active');
    if (isNewGameOpen) return;

    if (e.key >= '1' && e.key <= '9') {
        handleNumberInput(parseInt(e.key));
    } else if (e.key === '0') {
        handleMiss();
    } else if (e.key.toLowerCase() === 'd') {
        setMultiplier(2);
    } else if (e.key.toLowerCase() === 't') {
        setMultiplier(3);
    } else if (e.key.toLowerCase() === 's') {
        setMultiplier(1);
    } else if (e.key.toLowerCase() === 'u') {
        undoDart();
    } else if (e.key === 'Enter') {
        if (currentDarts.length === 3) {
            submitRound();
        }
    }
});

// New Game Modal Functions
function startNewGame() {
    const p1Name = document.getElementById('p1-name-input').value.trim();
    const p2Name = document.getElementById('p2-name-input').value.trim();
    const gameType = document.querySelector('input[name="game-type"]:checked').value;
    const firstTo = parseInt(document.getElementById('first-to-input').value);

    // Validation
    if (!p1Name || !p2Name) {
        showToast('Þú verð að slá inn nöfn beggja leikmanna!');
        return;
    }

    if (firstTo < 1 || firstTo > 20) {
        showToast('Leggir til að vinna verð að vera á milli 1 og 20!');
        return;
    }

    // Send game setup to server
    ws.send(JSON.stringify({
        type: 'updateName',
        roomId: currentRoomId,
        playerIndex: 0,
        name: p1Name
    }));

    ws.send(JSON.stringify({
        type: 'updateName',
        roomId: currentRoomId,
        playerIndex: 1,
        name: p2Name
    }));

    ws.send(JSON.stringify({
        type: 'updateGameType',
        roomId: currentRoomId,
        gameType: parseInt(gameType)
    }));

    // Reset game first to clear legs
    ws.send(JSON.stringify({
        type: 'resetGame',
        roomId: currentRoomId
    }));

    // Then update firstTo after reset
    ws.send(JSON.stringify({
        type: 'updateFirstTo',
        roomId: currentRoomId,
        value: firstTo
    }));
    
    currentDarts = [];
    currentMultiplier = 1;
    roundHistory = {
        0: [],
        1: []
    };
    updateUI();
    
    // Close modal
    document.getElementById('new-game-modal').classList.remove('active');
}
// === ANIMATION FUNCTIONS ===

/**
 * Create particles for leg win
 */
function createParticles() {
    const container = document.getElementById('leg-particles');
    if (!container) return;
    
    container.innerHTML = '';
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const angle = (Math.PI * 2 * i) / particleCount;
        const distance = 150 + Math.random() * 200;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        particle.style.left = '50%';
        particle.style.top = '50%';
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        particle.style.animationDelay = `${Math.random() * 0.3}s`;
        
        const colors = ['#ffcf33', '#ff8f1f', '#26d983', '#ffffff'];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        
        container.appendChild(particle);
    }
}

/**
 * Create confetti for game win
 */
function createConfetti() {
    const container = document.getElementById('confetti-container');
    if (!container) return;
    
    container.innerHTML = '';
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.animationDelay = `${Math.random() * 2}s`;
        confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
        
        const colors = ['#ffcf33', '#ff8f1f', '#26d983', '#ffffff', '#f0d583'];
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        
        const size = 8 + Math.random() * 6;
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size}px`;
        
        container.appendChild(confetti);
    }
}

/**
 * Trigger leg win animation
 */
function triggerLegWinAnimation(winnerIndex, autoStartNextLeg = false) {
    const legAnimation = document.getElementById('leg-win-animation');
    const winnerNameEl = document.getElementById('leg-winner-name');
    const legScoreEl = document.getElementById('leg-score');
    
    if (!legAnimation) return;
    
    const winner = gameState.players[winnerIndex];
    winnerNameEl.textContent = winner.name;
    
    const p1Legs = gameState.players[0].legs;
    const p2Legs = gameState.players[1].legs;
    legScoreEl.textContent = `${p1Legs} - ${p2Legs}`;
    
    // Create particles
    createParticles();
    
    // Show animation
    legAnimation.classList.remove('active');
    void legAnimation.offsetWidth;
    legAnimation.classList.add('active');
    
    // Hide after 6 seconds and optionally prep next leg
    setTimeout(() => {
        legAnimation.classList.remove('active');
        if (autoStartNextLeg) {
            resetForNextLeg();
        }
    }, 6000);
}

/**
 * Trigger game win animation
 */
function triggerWinAnimation() {
    const winAnimation = document.getElementById('win-animation');
    const winnerNameEl = document.getElementById('winner-name');
    const finalStatsEl = document.getElementById('final-stats');
    
    const winner = gameState.players[gameState.winner];
    const loser = gameState.players[1 - gameState.winner];
    
    winnerNameEl.textContent = winner.name;
    
    // Build final stats
    const statsHtml = `
        ${gameState.players[0].name}: ${gameState.players[0].legs} - ${gameState.players[1].legs} :${gameState.players[1].name}<br>
        Meðaltal: ${winner.average ? winner.average.toFixed(1) : '0.0'}
    `;
    finalStatsEl.innerHTML = statsHtml;
    
    // Create confetti
    createConfetti();
    
    // Show animation
    winAnimation.classList.remove('active');
    void winAnimation.offsetWidth;
    winAnimation.classList.add('active');
    
    // Hide after 5 seconds, then offer rematch/new game
    setTimeout(() => {
        winAnimation.classList.remove('active');
        showGameWinOptions(winner.name);
    }, 5000);
}