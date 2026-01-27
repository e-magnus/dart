/**
 * Event Handlers
 * Handles user input (buttons, keyboard) and WebSocket messages
 * Connects state changes to UI updates
 * Pure functions where possible - return what needs to change
 */

// Event handler functions

/**
 * Handle number input (1-20, 25, 50)
 */
function handleNumberInput(value) {
    if (gameState && gameState.bullUpPhase) {
        if (getCurrentDartCount() >= 1) {
            return false;
        }

        const multiplier = getCurrentMultiplier();
        addDartToRound(value, multiplier);
        submitRound();
        setCurrentMultiplier(1);
        return true;
    }

    // Can't throw if 3 darts already thrown
    if (getCurrentDartCount() >= 3) {
        console.log('Umferð búin, bíddu eftir næstu umferð...');
        return false;
    }

    // Add dart to state
    const multiplier = getCurrentMultiplier();
    addDartToRound(value, multiplier);

    // Check if we won the leg (exactly 0 with valid finish)
    const activePlayer = getActivePlayer();
    const totalScore = getCurrentRoundScore();
    const newScore = activePlayer.score - totalScore;

    // Auto-submit if leg won
    if (newScore === 0) {
        const lastDart = { value, multiplier };
        const finishedOnBull = value === 25 || value === 50;
        const validDoubleFinish = multiplier === 2 || finishedOnBull;
        
        if (!validDoubleFinish) {
            // Invalid finish, bust
            const reasonMessage = 'Þú verð að enda með tvöfaldan eða bull (25/50)!';
            sendBustToServer(getActivePlayerIndex(), getCurrentDartCount());
            showBustModal(activePlayer.score, totalScore, reasonMessage);
            resetCurrentRound();
            return false;
        }
        
        // Valid checkout - submit
        submitRound();
        return true;
    }

    // Reset multiplier for next dart
    setCurrentMultiplier(1);
    
    return true;
}

/**
 * Handle miss (0 points)
 */
function handleMiss() {
    if (gameState && gameState.bullUpPhase) {
        if (getCurrentDartCount() >= 1) {
            return false;
        }

        addDartToRound(0, 1);
        submitRound();
        setCurrentMultiplier(1);
        return true;
    }

    if (getCurrentDartCount() >= 3) {
        console.log('Umferð búin, bíddu á nýrri umferð...');
        return false;
    }

    addDartToRound(0, 1);

    // Auto-submit after 3 darts
    if (getCurrentDartCount() === 3) {
        submitRound();
    }

    setCurrentMultiplier(1);
    return true;
}

/**
 * Set dart multiplier (toggle if same)
 */
function handleSetMultiplier(mult) {
    const newMult = toggleMultiplier(mult);
    return newMult;
}

/**
 * Undo last dart
 */
function handleUndoDart() {
    // If no darts, show modal to undo full round
    if (getCurrentDartCount() === 0) {
        showUndoRoundModal();
        return false;
    }

    removeLastDart();
    setCurrentMultiplier(1);
    return true;
}

/**
 * Undo entire round
 */
function handleUndoRound() {
    const activePlayer = getActivePlayerIndex();
    const playerCount = gameState && gameState.players ? gameState.players.length : 2;
    const lastPlayer = playerCount > 0
        ? (activePlayer - 1 + playerCount) % playerCount
        : 0;
    
    // Remove from history
    removeLastScoreFromHistory(lastPlayer);
    
    // Send to server
    sendUndoToServer();
    
    return true;
}

/**
 * Submit current round
 */
function submitRound() {
    const activePlayerIndex = getActivePlayerIndex();
    const activePlayer = getActivePlayer();
    const totalScore = getCurrentRoundScore();

    // Must have at least 1 dart
    if (getCurrentDartCount() === 0) {
        return false;
    }

    if (gameState && gameState.bullUpPhase) {
        const bullUpPlayerIndex = getNextBullUpPlayerIndex();
        sendBullUpThrowToServer(bullUpPlayerIndex, totalScore);
        resetCurrentRound();
        return true;
    }

    // Check for bust
    const newScore = activePlayer.score - totalScore;
    if (newScore < 0 || newScore === 1) {
        sendBustToServer(activePlayerIndex, getCurrentDartCount());
        showBustModal(activePlayer.score, totalScore);
        resetCurrentRound();
        return false;
    }

    // Check for valid checkout (if score = 0)
    if (newScore === 0) {
        const lastDart = currentDarts[currentDarts.length - 1];
        const finishedOnBull = lastDart.value === 25 || lastDart.value === 50;
        const validDoubleFinish = lastDart.multiplier === 2 || finishedOnBull;
        
        if (!validDoubleFinish) {
            sendBustToServer(activePlayerIndex, getCurrentDartCount());
            showBustModal(activePlayer.score, totalScore, 'Þú verð að enda með tvöfaldan eða bull (25/50)!');
            resetCurrentRound();
            return false;
        }
    }

    // Add to history
    addScoreToHistory(activePlayerIndex, totalScore);
    
    // Send to server
    sendScoreToServer(activePlayerIndex, totalScore, getCurrentDartCount());
    
    return true;
}

/**
 * Handle reset game
 */
function handleResetGame() {
    if (confirm('Endurstilla allan leik?')) {
        resetCurrentRound();
        resetRoundHistory();
        sendResetGameToServer(gameState.players.length);
        return true;
    }
    return false;
}

/**
 * Handle new game
 */
function handleStartNewGame(playerNames, gameType, firstTo) {
    // Handle both old (p1Name, p2Name) and new (array) calling conventions
    let namesArray;
    if (Array.isArray(playerNames)) {
        namesArray = playerNames;
    } else {
        // Legacy: two string arguments
        namesArray = [playerNames, gameType];
        gameType = firstTo;
        firstTo = arguments[3];
    }

    // Validation
    if (!namesArray || namesArray.length === 0) {
        showToast('Þú verð að slá inn nöfn leikmanna!');
        return false;
    }

    if (namesArray.some(name => !name || !name.trim())) {
        showToast('Þú verð að slá inn nöfn allra leikmanna!');
        return false;
    }

    if (firstTo < 1 || firstTo > 20) {
        showToast('Leggir til að vinna verð að vera á milli 1 og 20!');
        return false;
    }

    // Generate new room ID for this new game
    currentRoomId = generateRoomId();
    saveRoomIdToStorage(currentRoomId);
    updateRoomIdDisplay();

    // Send updates to server
    sendResetGameToServer(namesArray.length);
    namesArray.forEach((name, index) => {
        sendPlayerNameToServer(index, name);
    });
    sendGameTypeToServer(parseInt(gameType));
    sendFirstToToServer(firstTo);
    // Player order is handled in the UI list

    // Reset local state
    resetCurrentRound();
    resetRoundHistory();
    
    return true;
}

/**
 * Handle player name change
 */
function handleUpdatePlayerName(playerIndex, newName) {
    sendPlayerNameToServer(playerIndex, newName);
    return true;
}

/**
 * Handle first-to change
 */
function handleUpdateFirstTo(newValue) {
    // Can't change during game
    if (gameState.players && gameState.players.some(player => player.legs > 0)) {
        showToast('Ekki er hægt að breyta þessu á meðan leikur er í gangi!');
        return false;
    }
    
    sendFirstToToServer(newValue);
    return true;
}

// ===== SERVER COMMUNICATION =====

/**
 * Send score to server
 */
function sendScoreToServer(playerIndex, value, darts) {
    const ws = getWebSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    
    ws.send(JSON.stringify({
        type: 'score',
        roomId: currentRoomId,
        playerIndex,
        value,
        darts
    }));
}

/**
 * Send bust to server
 */
function sendBustToServer(playerIndex, darts) {
    const ws = getWebSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    
    ws.send(JSON.stringify({
        type: 'bust',
        roomId: currentRoomId,
        playerIndex,
        darts
    }));
}

/**
 * Send undo to server
 */
function sendUndoToServer() {
    const ws = getWebSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    
    ws.send(JSON.stringify({
        type: 'undo',
        roomId: currentRoomId
    }));
}

/**
 * Send player name update to server
 */
function sendPlayerNameToServer(playerIndex, name) {
    const ws = getWebSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    
    ws.send(JSON.stringify({
        type: 'updateName',
        roomId: currentRoomId,
        playerIndex,
        name
    }));
}

/**
 * Send first-to update to server
 */
function sendFirstToToServer(value) {
    const ws = getWebSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    
    ws.send(JSON.stringify({
        type: 'updateFirstTo',
        roomId: currentRoomId,
        value
    }));
}

/**
 * Send game type update to server
 */
function sendGameTypeToServer(gameType) {
    const ws = getWebSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    
    ws.send(JSON.stringify({
        type: 'updateGameType',
        roomId: currentRoomId,
        gameType
    }));
}

/**
 * Send reset game to server
 */
function sendResetGameToServer(playerCount = 2) {
    const ws = getWebSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    
    ws.send(JSON.stringify({
        type: 'resetGame',
        roomId: currentRoomId,
        playerCount: Number(playerCount)
    }));
}

function sendStartBullUpToServer() {
    const ws = getWebSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify({
        type: 'startBullUp',
        roomId: currentRoomId
    }));
}

function sendBullUpThrowToServer(playerIndex, score) {
    const ws = getWebSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify({
        type: 'bullUpThrow',
        roomId: currentRoomId,
        playerIndex,
        score
    }));
}

// ===== WEBSOCKET MESSAGE HANDLER =====

/**
 * Handle state update from server
 * Called when server broadcasts game state changes
 */
function handleStateUpdate(message) {
    if (!message || !message.data) return;

    const previousActivePlayer = gameState.players
        ? gameState.players.findIndex(player => player.isActive)
        : null;
    const previousBullUpPhase = gameState.bullUpPhase;

    // Update local game state from server payload
    updateGameState(message.data);

    const currentActivePlayer = gameState.players.findIndex(player => player.isActive);

    // If player changed, clear local darts
    if (previousActivePlayer !== null && previousActivePlayer !== currentActivePlayer) {
        if (currentDarts.length > 0) {
            resetCurrentRound();
        }
    }

    // Refresh UI
    updateUI();
    updatePlayerStatusDisplay();

    if (gameState.bullUpPhase && !previousBullUpPhase) {
        showToast('Bull-up: hver leikmaður kastar einni pílu');
        resetCurrentRound();
    }

    // Handle leg/game win flags from server state
    if (message.data.legWin && message.data.legWinner !== undefined) {
        const legWinnerIndex = message.data.legWinner;
        const isGameWin = message.data.gameWin || false;

        setTimeout(() => {
            if (isGameWin) {
                triggerWinAnimation();
                // Delay modal until animation finishes
                setTimeout(() => {
                    showGameWinOptions(gameState.players[legWinnerIndex].name);
                }, 3000);
            } else {
                triggerLegWinAnimation(legWinnerIndex, true);
            }
        }, 100);
    }
}

// ===== EXPORTS (for testing and modular use) =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // Input handlers
        handleNumberInput,
        handleMiss,
        handleSetMultiplier,
        handleUndoDart,
        handleUndoRound,
        
        // Game logic handlers
        submitRound,
        handleResetGame,
        handleStartNewGame,
        handleUpdatePlayerName,
        handleUpdateFirstTo,
        
        // Server communication
        sendScoreToServer,
        sendBustToServer,
        sendUndoToServer,
        sendPlayerNameToServer,
        sendFirstToToServer,
        sendGameTypeToServer,
        sendResetGameToServer,
        sendStartBullUpToServer,
        sendBullUpThrowToServer,
        
        // Message handling
        handleStateUpdate
    };
}
