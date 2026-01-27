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

    if (gameState.players.length <= 2) {
        const p1 = gameState.players[0];
        const p2 = gameState.players[1];
        scoreElement.textContent = p2 ? `${p1.legs} - ${p2.legs}` : `${p1.legs}`;
        return;
    }

    scoreElement.textContent = gameState.players
        .map(player => player.legs)
        .join(' - ');
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
        const delayMs = Math.max(shouldDelayWin ? 3000 : 0, shouldDelayLeg ? 3000 : 0);
        setTimeout(show, delayMs);
        return;
    }

    show();
}

/**
 * Update average display for player
 */
function updatePlayerAverageDisplay(playerIndex) {
    const avgEl = document.getElementById(`p${playerIndex + 1}-avg`);
    if (!avgEl) return;
    
    const history = getRoundHistory(playerIndex);
    if (history.length === 0) {
        avgEl.textContent = 'Avg: 0.0';
        return;
    }
    
    const total = history.reduce((a, b) => a + b, 0);
    const dartCount = total > 0 ? history.length * 3 : 1;
    const average = (total / dartCount) * 3;
    avgEl.textContent = `Avg: ${average.toFixed(1)}`;
}
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
    const playerCount = gameState && gameState.players ? gameState.players.length : 2;
    const lastPlayer = playerCount > 0
        ? (activePlayerIndex - 1 + playerCount) % playerCount
        : 0;
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
    if (!gameState || !gameState.players) return;

    renderPlayerCardsIfNeeded();

    gameState.players.forEach((player, index) => {
        const scoreEl = document.getElementById(`p${index + 1}-score`);
        const nameEl = document.getElementById(`p${index + 1}-name`);
        if (scoreEl) scoreEl.textContent = player.score;
        if (nameEl) nameEl.textContent = player.name;
    });

    const bullUpIndex = gameState.bullUpPhase ? getNextBullUpPlayerIndex() : null;

    document.querySelectorAll('.player-card').forEach(card => {
        const index = parseInt(card.dataset.playerIndex, 10);
        if (Number.isNaN(index) || !gameState.players[index]) return;
        if (gameState.players[index].isActive || (bullUpIndex !== null && index === bullUpIndex)) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
}

/**
 * Render player cards dynamically based on player count
 */
function renderPlayerCardsIfNeeded() {
    const container = document.getElementById('player-scores');
    if (!container || !gameState || !gameState.players) return;

    const existingCards = container.querySelectorAll('.player-card');
    if (existingCards.length === gameState.players.length) {
        setPlayerScoreColumns(gameState.players.length);
        return;
    }

    container.innerHTML = '';
    setPlayerScoreColumns(gameState.players.length);

    gameState.players.forEach((player, index) => {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.dataset.playerIndex = index;
        card.innerHTML = `
            <div class="player-score" id="p${index + 1}-score">${player.score}</div>
            <div class="player-name" id="p${index + 1}-name" data-player-index="${index}" title="Smelltu til að breyta nafni">${player.name}</div>
            <div class="player-avg" id="p${index + 1}-avg">Avg: 0.0</div>
        `;
        container.appendChild(card);
    });
}

function setPlayerScoreColumns(playerCount) {
    const container = document.getElementById('player-scores');
    if (!container) return;
    const columns = Math.max(1, playerCount || 1);
    container.style.setProperty('--player-columns', columns);
    container.dataset.playerCount = String(columns);
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
    const playerCount = gameState && gameState.players ? gameState.players.length : 2;
    const totalTurns = Array.from({ length: playerCount }, (_, index) => getRoundHistory(index).length)
        .reduce((sum, count) => sum + count, 0);
    const roundNumber = Math.floor(totalTurns / Math.max(playerCount, 1)) + 1;
    
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
    if (!gameState || !gameState.players) return;

    gameState.players.forEach((player, index) => {
        const avgEl = document.getElementById(`p${index + 1}-avg`);
        if (!avgEl) return;

        const history = getRoundHistory(index);
        if (history.length === 0) {
            avgEl.textContent = 'Avg: 0.0';
            return;
        }

        const total = history.reduce((a, b) => a + b, 0);
        const dartCount = total > 0 ? history.length * 3 : 1;
        const average = (total / dartCount) * 3;
        avgEl.textContent = `Avg: ${average.toFixed(1)}`;
    });
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

function getSelectedPlayerCount() {
    const selected = document.querySelector('input[name="player-count"]:checked');
    const value = selected ? parseInt(selected.value, 10) : 2;
    return Number.isNaN(value) ? 2 : value;
}

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
    const playerCount = gameState.players.length;
    const firstToInput = document.getElementById('first-to-input');
    const playerCountRadios = document.querySelectorAll('input[name="player-count"]');

    if (playerCountRadios && playerCountRadios.length > 0) {
        playerCountRadios.forEach(radio => {
            radio.checked = radio.value === String(playerCount);
        });
    }

    if (typeof updatePlayerNameInputs === 'function') {
        updatePlayerNameInputs();
    }

    // Sync player names for all players
    for (let i = 0; i < playerCount; i++) {
        const input = document.getElementById(`p${i + 1}-name-input`);
        if (input && gameState.players[i]) {
            input.value = gameState.players[i].name;
        }
    }

    if (firstToInput) firstToInput.value = gameState.firstTo;
}

/**
 * Open OBS overlay in new window
 */
function openOverlay() {
    const overlayUrl = `${window.location.origin}/overlay/overlay.html?roomId=${currentRoomId}`;
    window.open(overlayUrl, 'obs-overlay', 'width=700,height=500,resizable=yes,scrollbars=no');
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
    const p2Legs = gameState.players[1]?.legs;
    if (legScoreEl) {
        legScoreEl.textContent = p2Legs !== undefined ? `${p1Legs} - ${p2Legs}` : `${p1Legs}`;
    }
    
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

function initPlayerNameEditing(state) {
    const container = document.getElementById('player-scores');
    if (!container || container.dataset.nameEditingBound === 'true') return;

    container.dataset.nameEditingBound = 'true';

    container.addEventListener('click', (event) => {
        const target = event.target.closest('.player-name');
        if (!target || target.querySelector('input')) return;

        const playerIndex = parseInt(target.dataset.playerIndex, 10);
        const currentState = typeof gameState !== 'undefined' ? gameState : state;
        if (Number.isNaN(playerIndex) || !currentState.players[playerIndex]) return;

        const currentName = currentState.players[playerIndex].name || `Leikmaður ${playerIndex + 1}`;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'player-name-input';

        target.innerHTML = '';
        target.appendChild(input);
        input.focus();
        input.select();

        const saveName = () => {
            const newName = input.value.trim() || `Leikmaður ${playerIndex + 1}`;
            currentState.players[playerIndex].name = newName;
            target.textContent = newName;
            target.dataset.playerIndex = playerIndex;

            if (typeof ws !== 'undefined' && ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'updateName',
                    roomId: currentRoomId,
                    playerIndex: playerIndex,
                    name: newName
                }));
            }

            window.dispatchEvent(new CustomEvent('playerNameChanged', { detail: { playerIndex, name: newName } }));
        };

        input.addEventListener('blur', saveName);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveName();
            }
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
