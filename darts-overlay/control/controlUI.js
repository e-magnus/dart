/**
 * Control Panel UI Updates
 * DOM manipulation and visual feedback
 */

function updatePlayerScores(gameState) {
    if (!gameState || !gameState.players) return;
    
    document.getElementById('p1-score').textContent = gameState.players[0].score;
    document.getElementById('p2-score').textContent = gameState.players[0].score;
    document.getElementById('p1-name').textContent = gameState.players[0].name;
    document.getElementById('p2-name').textContent = gameState.players[1].name;
}

function updatePlayerAverages(gameState) {
    if (!gameState || !gameState.players) return;
    
    const p1Avg = gameState.players[0].average || 0;
    const p2Avg = gameState.players[1].average || 0;
    
    document.getElementById('p1-avg').textContent = `Avg: ${p1Avg.toFixed(1)}`;
    document.getElementById('p2-avg').textContent = `Avg: ${p2Avg.toFixed(1)}`;
}

function updateRoomDisplay(roomId) {
    const roomElement = document.getElementById('room-id');
    if (roomElement) {
        roomElement.textContent = roomId || '------';
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }
}

function showModal(modalId, show = true) {
    const modal = document.getElementById(modalId);
    if (modal) {
        if (show) {
            modal.classList.add('show');
        } else {
            modal.classList.remove('show');
        }
    }
}

function updateDartLabel(dartIndex, text, extraClass = '') {
    const dartLabel = document.getElementById(`dart-${dartIndex}`);
    if (dartLabel) {
        dartLabel.innerHTML = text;
        dartLabel.classList.remove('active', 'bust');
        if (extraClass) {
            dartLabel.classList.add(extraClass);
        }
    }
}

function clearDartTracker() {
    for (let i = 1; i <= 3; i++) {
        updateDartLabel(i, `PÍLA ${i}`);
    }
}

function updateCheckoutDisplay(text) {
    const element = document.getElementById('checkout-suggestion');
    if (element) {
        element.textContent = text || '—';
    }
}

function updateRoundNumber(roundNum) {
    const element = document.getElementById('round-number');
    if (element) {
        element.textContent = roundNum;
    }
}

function setPlayerCardActive(playerIndex) {
    document.querySelectorAll('.player-card').forEach((card, idx) => {
        if (idx === playerIndex) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
}

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

module.exports = {
    updatePlayerScores,
    updatePlayerAverages,
    updateRoomDisplay,
    showToast,
    showModal,
    updateDartLabel,
    clearDartTracker,
    updateCheckoutDisplay,
    updateRoundNumber,
    setPlayerCardActive,
    initPlayerNameEditing
};
