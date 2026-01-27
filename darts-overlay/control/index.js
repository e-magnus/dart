/**
 * Control Panel Initialization
 * Sets up WebSocket connection and binds all event listeners
 * Brings together gameState, handlers, and ui modules
 */

// ===== WEBSOCKET INITIALIZATION =====

/**
 * Initialize WebSocket connection
 */
function initWebSocket() {
    const wsUrl = getWebSocketURL();
    
    try {
        const ws = new WebSocket(wsUrl);
        setWebSocket(ws);
        
        ws.addEventListener('open', () => {
            console.log('WebSocket connected');
            updateConnectionStatus(true);
            
            // Send join message
            ws.send(JSON.stringify({
                type: 'join',
                roomId: currentRoomId
            }));
        });
        
        ws.addEventListener('message', (event) => {
            try {
                const message = JSON.parse(event.data);
                
                switch (message.type) {
                    case 'stateUpdate':
                        handleStateUpdate(message);
                        break;
                    default:
                        console.log('Unknown message type:', message.type);
                }
            } catch (e) {
                console.error('Error parsing message:', e);
            }
        });
        
        ws.addEventListener('error', (error) => {
            console.error('WebSocket error:', error);
            updateConnectionStatus(false);
            showToast('Tenging tapaðist - reynum aftur...');
        });
        
        ws.addEventListener('close', () => {
            console.log('WebSocket disconnected');
            updateConnectionStatus(false);
            // Attempt reconnect
            setTimeout(initWebSocket, 3000);
        });
    } catch (e) {
        console.error('Failed to create WebSocket:', e);
        showToast('Gat ekki tengst server!');
    }
}

// ===== EVENT LISTENERS =====

/**
 * Attach all event listeners to DOM elements
 */
function attachEventListeners() {
    // Number pad buttons
    document.querySelectorAll('.num-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const value = parseInt(e.target.dataset.value);
            handleNumberInput(value);
            updateUI();
        });
    });

    // Modifier buttons
    const doubleBtn = document.getElementById('double-btn');
    const tripleBtn = document.getElementById('triple-btn');
    
    if (doubleBtn) {
        doubleBtn.addEventListener('click', () => {
            handleSetMultiplier(2);
            updateUI();
        });
    }
    
    if (tripleBtn) {
        tripleBtn.addEventListener('click', () => {
            handleSetMultiplier(3);
            updateUI();
        });
    }

    // Pad undo button
    const undoPadBtn = document.getElementById('undo-pad-btn');
    if (undoPadBtn) {
        undoPadBtn.addEventListener('click', () => {
            handleUndoDart();
            updateUI();
        });
    }

    // Live overlay button
    const liveBtn = document.getElementById('live-indicator');
    if (liveBtn) {
        liveBtn.addEventListener('click', openOverlay);
    }

    // Control buttons
    const undoBtn = document.getElementById('undo-dart-btn');
    if (undoBtn) {
        undoBtn.addEventListener('click', () => {
            handleUndoDart();
            updateUI();
        });
    }

    const submitBtn = document.getElementById('submit-round-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            // Disable buttons while submitting
            undoBtn.disabled = true;
            undoBtn.classList.remove('btn-undo-active');
            undoBtn.classList.add('btn-undo-inactive');
            
            submitBtn.disabled = true;
            submitBtn.classList.remove('btn-submit-active');
            submitBtn.classList.add('btn-submit-inactive');
            
            submitRound();
            updateUI();
        });
    }

    // Bust modal button
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
        retryBtn.addEventListener('click', hideBustModal);
    }

    // Undo round modal buttons
    const confirmUndoBtn = document.getElementById('confirmUndoRoundBtn');
    const cancelUndoBtn = document.getElementById('cancelUndoRoundBtn');
    
    if (confirmUndoBtn) {
        confirmUndoBtn.addEventListener('click', () => {
            if (getPendingUndoRound()) {
                hideUndoRoundModal();
                handleUndoRound();
            }
        });
    }
    
    if (cancelUndoBtn) {
        cancelUndoBtn.addEventListener('click', hideUndoRoundModal);
    }

    // New Game button
    const newGameBtn = document.getElementById('new-game-btn');
    if (newGameBtn) {
        newGameBtn.addEventListener('click', openNewGameModalWithCurrentSettings);
    }

    // Game win options modal buttons
    const rematchBtn = document.getElementById('win-rematch-btn');
    const newGameFromWinBtn = document.getElementById('win-newgame-btn');
    
    if (rematchBtn) {
        rematchBtn.addEventListener('click', () => {
            hideGameWinOptions();
            // Reset game but keep names
            sendResetGameToServer();
            resetCurrentRound();
            resetRoundHistory();
            updateUI();
        });
    }
    
    if (newGameFromWinBtn) {
        newGameFromWinBtn.addEventListener('click', () => {
            hideGameWinOptions();
            openNewGameModalWithCurrentSettings();
        });
    }

    // Start new game button
    const startNewGameBtn = document.getElementById('start-new-game-btn');
    if (startNewGameBtn) {
        startNewGameBtn.addEventListener('click', () => {
            const p1Name = document.getElementById('p1-name-input').value.trim();
            const p2Name = document.getElementById('p2-name-input').value.trim();
            const gameType = document.querySelector('input[name="game-type"]:checked').value;
            const firstTo = parseInt(document.getElementById('first-to-input').value);

            if (handleStartNewGame(p1Name, p2Name, gameType, firstTo)) {
                closeSettings();
                updateUI();
            }
        });
    }

    // Player name inputs
    const p1NameInput = document.getElementById('p1-name-input');
    const p2NameInput = document.getElementById('p2-name-input');
    
    if (p1NameInput) {
        p1NameInput.addEventListener('change', (e) => {
            handleUpdatePlayerName(0, e.target.value);
        });
    }
    
    if (p2NameInput) {
        p2NameInput.addEventListener('change', (e) => {
            handleUpdatePlayerName(1, e.target.value);
        });
    }

    // First-to input
    const firstToInput = document.getElementById('first-to-input');
    if (firstToInput) {
        firstToInput.addEventListener('change', (e) => {
            if (!handleUpdateFirstTo(parseInt(e.target.value))) {
                syncInputsWithGameState();
            }
        });
    }

    // Game type selection
    document.querySelectorAll('input[name="game-type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            sendGameTypeToServer(parseInt(e.target.value));
        });
    });
}

// ===== KEYBOARD SUPPORT =====

/**
 * Attach keyboard event listeners
 */
function attachKeyboardListeners() {
    document.addEventListener('keydown', (e) => {
        // Ignore hotkeys while typing in inputs
        const target = e.target;
        const tag = target && target.tagName ? target.tagName.toLowerCase() : '';
        const isEditable = target && (target.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select');
        if (isEditable) return;

        // Ignore hotkeys when settings modal is open
        const newGameModal = document.getElementById('new-game-modal');
        const isNewGameOpen = newGameModal && newGameModal.classList.contains('active');
        if (isNewGameOpen) return;

        // Number keys
        if (e.key >= '1' && e.key <= '9') {
            handleNumberInput(parseInt(e.key));
            updateUI();
        }
        // 0 = miss
        else if (e.key === '0') {
            handleMiss();
            updateUI();
        }
        // D = double
        else if (e.key.toLowerCase() === 'd') {
            handleSetMultiplier(2);
            updateUI();
        }
        // T = triple
        else if (e.key.toLowerCase() === 't') {
            handleSetMultiplier(3);
            updateUI();
        }
        // S = single
        else if (e.key.toLowerCase() === 's') {
            handleSetMultiplier(1);
            updateUI();
        }
        // U = undo dart
        else if (e.key.toLowerCase() === 'u') {
            handleUndoDart();
            updateUI();
        }
        // Enter = submit round if 3 darts
        else if (e.key === 'Enter') {
            if (getCurrentDartCount() === 3) {
                submitRound();
            }
        }
    });
}

// ===== PAGE INITIALIZATION =====

/**
 * Initialize everything when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize room ID
    initRoomId();
    updateRoomIdDisplay();
    displayRoomId();
    
    // Initialize connection status
    updateConnectionStatus(false);
    
    // Initialize WebSocket
    initWebSocket();
    
    // Sync form inputs with initial state
    syncInputsWithGameState();
    
    // Attach all event listeners
    attachEventListeners();
    attachKeyboardListeners();
    
    // Initial UI update
    updateUI();
    updatePlayerStatusDisplay();
    
    console.log('Control panel initialized');

    // Register service worker for PWA installability
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/control/sw.js', { scope: '/control/' })
            .then(() => console.log('Service worker registered'))
            .catch((err) => console.warn('Service worker registration failed', err));
    }
});

// ===== EXPORTS (for testing) =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initWebSocket,
        attachEventListeners,
        attachKeyboardListeners
    };
}
