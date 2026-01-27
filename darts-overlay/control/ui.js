/**
 * Update connection status indicator
 */
function updateConnectionStatus(isConnected) {
    const indicator = document.getElementById('connection-indicator');
    const text = document.getElementById('connection-text');
    
    if (!indicator || !text) return;
    
    if (isConnected) {
        indicator.textContent = '🟢';
        indicator.classList.remove('disconnected');
        text.textContent = 'Tengt';
    } else {
        indicator.textContent = '🔴';
        indicator.classList.add('disconnected');
        text.textContent = 'Ótengt';
    }
}

/**
 * Update player status display in footer
 */
function updatePlayerStatusDisplay() {
    const scoreElement = document.getElementById('player-status-score');
    if (!scoreElement || !gameState || !gameState.players) return;

    const p1 = gameState.players[0];
    const p2 = gameState.players[1];
    scoreElement.textContent = `${p1.legs} - ${p2.legs}`;
}

/**
 * Update room ID display in footer
 */
function updateRoomIdDisplay() {
    const roomElement = document.getElementById('room-id');
    if (!roomElement) return;
    
    roomElement.textContent = currentRoomId || '------';
}

// ===== TOAST NOTIFICATIONS =====

/**
 * Show toast notification
 */
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    const winAnimation = document.getElementById('win-animation');
    const legAnimation = document.getElementById('leg-win-animation');
    const shouldDelayWin = winAnimation && winAnimation.classList.contains('active');
    const shouldDelayLeg = legAnimation && legAnimation.classList.contains('active');

    const show = () => {
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    };

    if (shouldDelayWin || shouldDelayLeg) {
        const delayMs = Math.max(shouldDelayWin ? 5200 : 0, shouldDelayLeg ? 6200 : 0);
        setTimeout(show, delayMs);
        return;
    }
    show();
}

// ===== MODALS =====

/**
 * Show leg win modal
 */
function showLegWinModal(message, isGameWin, legWinnerIndex) {
    const modal = document.getElementById('legWinModal');
    const text = document.getElementById('legWinText');
    
    if (!modal || !text) return;
    
    text.textContent = message;
    modal.classList.add('show');
    
    // Don't auto-close if it's a game win (user needs to choose rematch/new game)
    if (!isGameWin) {
        setTimeout(() => {
            hideLegWinModal();
        }, 3000);
    }
}

/**
 * Hide leg win modal
 */
function hideLegWinModal() {
    const modal = document.getElementById('legWinModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Show game win options
 */
function showGameWinOptions(winnerName) {
    const modal = document.getElementById('gameWinOptionsModal');
    const text = document.getElementById('gameWinOptionsText');
    
    if (!modal || !text) return;
    
    text.textContent = `${winnerName} vann leikinn!`;
    modal.classList.add('show');
}

/**
 * Hide game win options
 */
function hideGameWinOptions() {
    const modal = document.getElementById('gameWinOptionsModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Show bust modal
 */
function showBustModal(currentScore, scoreThrown, reasonMessage = '') {
    const modal = document.getElementById('bustModal');
    const playerName = document.getElementById('bustPlayerName');
    const message = document.getElementById('bustMessage');
    
    if (!modal || !playerName || !message) return;
    
    const activePlayer = getActivePlayer();
    playerName.textContent = activePlayer.name;
    if (reasonMessage) {
        message.textContent = reasonMessage;
    } else {
        message.textContent = `${currentScore - scoreThrown}`;
    }
    
    modal.classList.add('show');
}

/**
 * Hide bust modal
 */
function hideBustModal() {
    const modal = document.getElementById('bustModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Show undo round modal
 */
function showUndoRoundModal() {
    const modal = document.getElementById('undoRoundModal');
    const message = document.getElementById('undoRoundMessage');
    
    if (!modal || !message) return;
    
    const activePlayerIndex = getActivePlayerIndex();
    const lastPlayer = 1 - activePlayerIndex;
    const lastPlayerName = gameState.players[lastPlayer]?.name || `Leikmaður ${lastPlayer + 1}`;
    const hasRoundToUndo = getRoundHistory(lastPlayer).length > 0;

    if (!hasRoundToUndo) {
        showToast('Engin heildarumferð til að afturkalla.');
        return;
    }

    message.textContent = `Þú ert að fara að afturkalla heila umferð hjá ${lastPlayerName}.`;
    setPendingUndoRound(true);
    modal.classList.add('show');
}

/**
 * Hide undo round modal
 */
function hideUndoRoundModal() {
    const modal = document.getElementById('undoRoundModal');
    if (modal) {
        modal.classList.remove('show');
        setPendingUndoRound(false);
    }
}

// ===== GAME UI UPDATES =====

/**
 * Update all game UI elements
 */
function updateUI() {
    updatePlayerScores();
    updateDartTracker();
    updateModifierDisplay();
    updateNumberPadDisplay();
    updateCheckoutSuggestion();
    updatePlayerAverages();
    updateDartTrackerBustStatus();
    updateSpecialButtonAvailability();
}

/**
 * Update player score displays
 */
function updatePlayerScores() {
    if (!gameState || !gameState.players || gameState.players.length < 2) return;

    const p1Score = document.getElementById('p1-score');
    const p2Score = document.getElementById('p2-score');
    const p1Name = document.getElementById('p1-name');
    const p2Name = document.getElementById('p2-name');
    const p1Card = document.querySelector('.player-card.player-1');
    const p2Card = document.querySelector('.player-card.player-2');
    
    if (p1Score) p1Score.textContent = gameState.players[0].score;
    if (p2Score) p2Score.textContent = gameState.players[1].score;
    if (p1Name) p1Name.textContent = gameState.players[0].name;
    if (p2Name) p2Name.textContent = gameState.players[1].name;

    if (p1Card && p2Card) {
        if (gameState.players[0].isActive) {
            p1Card.classList.add('active');
            p2Card.classList.remove('active');
        } else {
            p1Card.classList.remove('active');
            p2Card.classList.add('active');
        }
    }
}

/**
 * Update dart tracker display
 */
function updateDartTracker() {
    // Update dart labels
    for (let i = 1; i <= 3; i++) {
        const dartLabel = document.getElementById(`dart-${i}`);
        if (!dartLabel) continue;

        const dart = currentDarts[i - 1];
        if (!dart) {
            dartLabel.textContent = `PÍLA ${i}`;
            dartLabel.classList.remove('active', 'bust');
            continue;
        }

        if (dart.value === 0) {
            dartLabel.textContent = 'MISS';
        } else {
            const prefix = dart.multiplier === 2 ? 'D' : dart.multiplier === 3 ? 'T' : '';
            dartLabel.textContent = `${prefix}${dart.value}`;
        }
    }

    // Update the round number display
    const totalDarts = getRoundHistory(0).length + getRoundHistory(1).length;
    const roundNumber = Math.floor(totalDarts / 2) + 1;
    
    const roundEl = document.getElementById('round-number');
    if (roundEl) {
        roundEl.textContent = roundNumber;
    }
}

/**
 * Update modifier display (SINGLE/DOUBLE/TRIPLE buttons)
 */
function updateModifierDisplay() {
    const doubleBtn = document.getElementById('double-btn');
    const tripleBtn = document.getElementById('triple-btn');
    
    if (doubleBtn) {
        if (getCurrentMultiplier() === 2) {
            doubleBtn.classList.add('active');
        } else {
            doubleBtn.classList.remove('active');
        }
    }
    
    if (tripleBtn) {
        if (getCurrentMultiplier() === 3) {
            tripleBtn.classList.add('active');
        } else {
            tripleBtn.classList.remove('active');
        }
    }
}

/**
 * Update number pad button display
 */
function updateNumberPadDisplay() {
    const submitBtn = document.getElementById('submit-round-btn');
    const undoBtn = document.getElementById('undo-dart-btn');

    if (!submitBtn || !undoBtn) return;

    const dartCount = getCurrentDartCount();

    // Update number pad button prefixes
    const prefix = getCurrentMultiplier() === 2 ? 'D' : getCurrentMultiplier() === 3 ? 'T' : '';
    document.querySelectorAll('.num-btn').forEach(btn => {
        const value = parseInt(btn.dataset.value, 10);
        if (value >= 1 && value <= 20) {
            btn.textContent = `${prefix}${value}`;
        }
    });

    // Enable undo if darts thrown
    if (dartCount > 0) {
        undoBtn.disabled = false;
        undoBtn.classList.remove('btn-undo-inactive');
        undoBtn.classList.add('btn-undo-active');
    } else {
        undoBtn.disabled = true;
        undoBtn.classList.remove('btn-undo-active');
        undoBtn.classList.add('btn-undo-inactive');
    }

    // Enable submit if 3 darts or valid checkout
    if (dartCount === 3) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('btn-submit-inactive');
        submitBtn.classList.add('btn-submit-active');
    } else if (dartCount > 0 && dartCount < 3) {
        // Check if already won
        const activePlayer = getActivePlayer();
        const totalScore = getCurrentRoundScore();
        const newScore = activePlayer.score - totalScore;

        if (newScore === 0) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('btn-submit-inactive');
            submitBtn.classList.add('btn-submit-active');
        } else {
            submitBtn.disabled = true;
            submitBtn.classList.remove('btn-submit-active');
            submitBtn.classList.add('btn-submit-inactive');
        }
    } else {
        submitBtn.disabled = true;
        submitBtn.classList.remove('btn-submit-active');
        submitBtn.classList.add('btn-submit-inactive');
    }
}

/**
 * Update checkout suggestion
 */
function updateCheckoutSuggestion() {
    const suggestEl = document.getElementById('checkout-suggestion');
    if (!suggestEl) return;

    const currentRoundScore = getCurrentRoundScore();

    if (currentRoundScore === 0) {
        suggestEl.textContent = '—';
        suggestEl.style.color = '#333333';
    } else {
        suggestEl.textContent = `${currentRoundScore}`;
        suggestEl.style.color = '#000000';
    }
}

/**
 * Update player averages
 */
function updatePlayerAverages() {
    updateP1AverageDisplay();
    updateP2AverageDisplay();
}

/**
 * Update player 1 average
 */
function updateP1AverageDisplay() {
    const avgEl = document.getElementById('p1-avg');
    if (!avgEl) return;
    
    const history = getRoundHistory(0);
    if (history.length === 0) {
        avgEl.textContent = 'Avg: 0.0';
        return;
    }
    
    const total = history.reduce((a, b) => a + b, 0);
    const dartCount = total > 0 ? history.length * 3 : 1; // Assume 3 darts per turn
    const average = (total / dartCount) * 3;
    avgEl.textContent = `Avg: ${average.toFixed(1)}`;
}

/**
 * Update player 2 average
 */
function updateP2AverageDisplay() {
    const avgEl = document.getElementById('p2-avg');
    if (!avgEl) return;
    
    const history = getRoundHistory(1);
    if (history.length === 0) {
        avgEl.textContent = 'Avg: 0.0';
        return;
    }
    
    const total = history.reduce((a, b) => a + b, 0);
    const dartCount = total > 0 ? history.length * 3 : 1;
    const average = (total / dartCount) * 3;
    avgEl.textContent = `Avg: ${average.toFixed(1)}`;
}

/**
 * Update dart tracker bust status
 */
function updateDartTrackerBustStatus() {
    const activePlayer = getActivePlayer();
    const totalScore = getCurrentRoundScore();
    const newScore = activePlayer.score - totalScore;
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
}

/**
 * Enable/disable special buttons based on multiplier
 */
function updateSpecialButtonAvailability() {
    const btn0 = document.querySelector('[data-value="0"]');
    const btn25 = document.querySelector('[data-value="25"]');
    const btn50 = document.querySelector('[data-value="50"]');
    
    if (!btn0 || !btn25 || !btn50) return;
    
    const mult = getCurrentMultiplier();
    const isDouble = mult === 2;
    const isTriple = mult === 3;
    
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
        btn0.disabled = false;
        btn0.classList.remove('btn-disabled');
        btn25.disabled = false;
        btn25.classList.remove('btn-disabled');
        btn50.disabled = false;
        btn50.classList.remove('btn-disabled');
    }
}

// ===== SETTINGS UI =====

/**
 * Open new game settings modal
 */
function openNewGameModalWithCurrentSettings() {
    const modal = document.getElementById('new-game-modal');
    if (modal) {
        modal.classList.add('active');
        syncInputsWithGameState();
    }
}

/**
 * Close settings modal
 */
function closeSettings() {
    const modal = document.getElementById('new-game-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Sync form inputs with current game state
 */
function syncInputsWithGameState() {
    const p1Input = document.getElementById('p1-name-input');
    const p2Input = document.getElementById('p2-name-input');
    const firstToInput = document.getElementById('first-to-input');
    
    if (p1Input) p1Input.value = gameState.players[0].name;
    if (p2Input) p2Input.value = gameState.players[1].name;
    if (firstToInput) firstToInput.value = gameState.firstTo;
}

/**
 * Open OBS overlay in new window
 */
function openOverlay() {
    const overlayUrl = `${window.location.origin}/overlay/overlay.html?roomId=${currentRoomId}`;
    window.open(overlayUrl, 'obs-overlay', 'width=1920,height=1080,resizable=yes,scrollbars=no');
}

/**
 * Display room ID in UI
 */
function displayRoomId() {
    const roomIdEl = document.getElementById('room-id');
    if (roomIdEl) {
        roomIdEl.textContent = currentRoomId;
    }
}

// ===== ANIMATIONS =====

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
    if (winnerNameEl) winnerNameEl.textContent = winner.name;
    
    const p1Legs = gameState.players[0].legs;
    const p2Legs = gameState.players[1].legs;
    if (legScoreEl) legScoreEl.textContent = `${p1Legs} - ${p2Legs}`;
    
    createParticles();
    
    legAnimation.classList.remove('active');
    void legAnimation.offsetWidth; // Trigger reflow
    legAnimation.classList.add('active');
    
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
    if (!winAnimation) return;
    
    createConfetti();
    
    winAnimation.classList.remove('active');
    void winAnimation.offsetWidth; // Trigger reflow
    winAnimation.classList.add('active');

    // Remove active class after animation to restore pointer events
    setTimeout(() => {
        winAnimation.classList.remove('active');
    }, 5200);
}

/**
 * Reset UI for next leg
 */
function resetForNextLeg() {
    resetCurrentRound();
    updateUI();
    hideLegWinModal();
}

// ===== PLAYER NAME EDITING =====

/**
 * Initialize click-to-edit functionality for player names
 */
function initPlayerNameEditing(gameState) {
    const playerNameElements = [
        { elem: document.getElementById('p1-name'), playerIndex: 0 },
        { elem: document.getElementById('p2-name'), playerIndex: 1 }
    ];

    playerNameElements.forEach(({ elem, playerIndex }) => {
        if (!elem) return;

        elem.addEventListener('click', () => {
            if (elem.querySelector('input')) return; // Already editing

            const currentName = gameState.players[playerIndex].name || `Leikmaður ${playerIndex + 1}`;
            
            // Create input field
            const input = document.createElement('input');
            input.type = 'text';
            input.value = currentName;
            input.className = 'player-name-input';

            // Replace text with input
            elem.innerHTML = '';
            elem.appendChild(input);
            input.focus();
            input.select();

            const saveName = () => {
                const newName = input.value.trim() || `Leikmaður ${playerIndex + 1}`;
                gameState.players[playerIndex].name = newName;
                elem.textContent = newName;
                
                // Send name update to server
                if (typeof ws !== 'undefined' && ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: 'updateName',
                        roomId: currentRoomId,
                        playerIndex: playerIndex,
                        name: newName
                    }));
                }
                
                // Emit event for other components to update
                window.dispatchEvent(new CustomEvent('playerNameChanged', { detail: { playerIndex, name: newName } }));
            };

            // Save on Enter or blur
            input.addEventListener('blur', saveName);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    saveName();
                }
                if (e.key === 'Escape') {
                    elem.textContent = currentName;
                }
            });
        });
    });
}

// ===== EXPORTS (for testing and modular use) =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // Notifications
        showToast,
        
        // Modals
        showLegWinModal,
        hideLegWinModal,
        showGameWinOptions,
        hideGameWinOptions,
        showBustModal,
        hideBustModal,
        showUndoRoundModal,
        hideUndoRoundModal,
        
        // UI updates
        updateUI,
        updatePlayerScores,
        updateDartTracker,
        updateModifierDisplay,
        updateNumberPadDisplay,
        updateCheckoutSuggestion,
        updatePlayerAverages,
        updateDartTrackerBustStatus,
        updateSpecialButtonAvailability,
        
        // Settings
        openNewGameModalWithCurrentSettings,
        closeSettings,
        syncInputsWithGameState,
        openOverlay,
        displayRoomId,
        
        // Animations
        triggerLegWinAnimation,
        triggerWinAnimation,
        resetForNextLeg,
        
        // Player name editing
        initPlayerNameEditing
    };
}
