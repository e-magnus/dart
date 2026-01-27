/**
 * Control Panel Initialization
 * Sets up WebSocket connection and binds all event listeners
 * Brings together gameState, handlers, and ui modules
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
            sendResetGameToServer(gameState.players.length);
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

    // Cancel new game button
    const cancelNewGameBtn = document.getElementById('cancel-new-game-btn');
    if (cancelNewGameBtn) {
        cancelNewGameBtn.addEventListener('click', () => {
            // Reset form to current game state before closing
            syncInputsWithGameState();
            closeSettings();
        });
    }

    // Start new game button
    const startNewGameBtn = document.getElementById('start-new-game-btn');
    if (startNewGameBtn) {
        startNewGameBtn.addEventListener('click', () => {
            const playerCount = getSelectedPlayerCount();
            const playerNames = [];
            const gameType = document.querySelector('input[name="game-type"]:checked').value;
            const firstTo = parseInt(document.getElementById('first-to-input').value);

            for (let i = 0; i < playerCount; i++) {
                const input = document.getElementById(`p${i + 1}-name-input`);
                if (input) {
                    playerNames.push(input.value.trim());
                }
            }

            if (handleStartNewGame(playerNames, gameType, firstTo)) {
                closeSettings();
                updateUI();
            }
        });
    }

    // Player count radios
    const playerCountRadios = document.querySelectorAll('input[name="player-count"]');
    if (playerCountRadios.length > 0) {
        playerCountRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                updatePlayerNameInputs();
                updateBullUpOption();
            });
        });
        // Initialize on first load
        updatePlayerNameInputs();
        updateBullUpOption();
    }


function getSelectedPlayerCount() {
    const selected = document.querySelector('input[name="player-count"]:checked');
    const value = selected ? parseInt(selected.value, 10) : 2;
    return Number.isNaN(value) ? 2 : value;
}
    // Note: Player name, first-to, and game-type inputs in the New Game modal
    // are only saved when "Byrja nýjan leik" button is clicked.
    // This allows users to cancel without saving changes.
}

/**
 * Update player name input fields based on selected player count
 */
function updatePlayerNameInputs() {
    const playerCount = getSelectedPlayerCount();
    const container = document.getElementById('player-names-container');
    
    if (!container) return;
    
    // Clear existing inputs
    container.innerHTML = '';
    
    // Create inputs for each player
    for (let i = 1; i <= playerCount; i++) {
        const div = document.createElement('div');
        div.className = 'settings-group';
        div.innerHTML = `
            <label for="p${i}-name-input">Leikmaður ${i}:</label>
            <input type="text" id="p${i}-name-input" placeholder="Nafn">
        `;
        container.appendChild(div);
    }
}

/**
 * Show/hide bull-up option based on player count
 */
function updateBullUpOption() {
    const playerCount = getSelectedPlayerCount();
    const bullUpOption = document.getElementById('bull-up-option');
    
    if (bullUpOption) {
        bullUpOption.style.display = playerCount > 2 ? 'block' : 'none';
    }
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
    
    // Initialize player name click-to-edit functionality
    initPlayerNameEditing(gameState);
    
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
