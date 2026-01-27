/**
 * Server Integration Tests - Phase 4
 * Tests complete game scenarios with real WebSocket-like message flows
 * Verifies room isolation, state persistence, and edge cases
 */

const { dispatchMessage, handleRoomMessage } = require('../websocketDispatcher');
const { createInitialGameState } = require('../gameLogic');

describe('Phase 4: Server Integration Tests', () => {
    let rooms;
    let mockClients;

    beforeEach(() => {
        rooms = new Map();
        mockClients = new Map();
    });

    // ===== ROOM ISOLATION =====
    describe('Room Isolation', () => {
        it('should maintain independent game states for different rooms', () => {
            const room1 = createInitialGameState();
            const room2 = createInitialGameState();
            
            rooms.set('ROOM1', room1);
            rooms.set('ROOM2', room2);

            // Score in room 1
            const msg1 = { type: 'score', data: { value: 100 } };
            handleRoomMessage(rooms, 'ROOM1', msg1, []);

            expect(rooms.get('ROOM1').players[0].score).toBe(401);
            expect(rooms.get('ROOM2').players[0].score).toBe(501); // Unchanged
        });

        it('should not broadcast room1 events to room2 clients', () => {
            const room1State = createInitialGameState();
            const room2State = createInitialGameState();
            
            rooms.set('ROOM1', room1State);
            rooms.set('ROOM2', room2State);

            const client1 = { readyState: 1, send: jest.fn() };
            const client2 = { readyState: 1, send: jest.fn() };
            
            mockClients.set('ROOM1', [client1]);
            mockClients.set('ROOM2', [client2]);

            // Score in room 1
            const msg = { type: 'score', data: { value: 50 } };
            handleRoomMessage(rooms, 'ROOM1', msg, mockClients.get('ROOM1'));

            // Only room1 clients got update
            expect(client1.send).toHaveBeenCalled();
            expect(client2.send).not.toHaveBeenCalled();
        });

        it('should support multiple concurrent games with same settings', () => {
            const room1 = createInitialGameState();
            const room2 = createInitialGameState();
            const room3 = createInitialGameState();
            
            rooms.set('GAME1', room1);
            rooms.set('GAME2', room2);
            rooms.set('GAME3', room3);

            // Different actions in each room
            handleRoomMessage(rooms, 'GAME1', { type: 'score', data: { value: 100 } }, []);
            handleRoomMessage(rooms, 'GAME2', { type: 'score', data: { value: 50 } }, []);
            handleRoomMessage(rooms, 'GAME3', { type: 'score', data: { value: 200 } }, []);

            expect(rooms.get('GAME1').players[0].score).toBe(401);
            expect(rooms.get('GAME2').players[0].score).toBe(451);
            expect(rooms.get('GAME3').players[0].score).toBe(301);
        });
    });

    // ===== COMPLETE GAME SCENARIOS =====
    describe('Complete Game Flow', () => {
        it('should handle complete 3-leg match', () => {
            let state = createInitialGameState();
            state.firstTo = 3;

            // Leg 1: Player 1 wins (score 50)
            state = {
                ...state,
                players: [
                    { ...state.players[0], score: 50 },
                    state.players[1]
                ]
            };
            let result = dispatchMessage(state, { type: 'score', data: { value: 50 } });
            state = result.gameState;
            
            expect(state.players[0].legs).toBe(1);
            expect(state.players[1].isActive).toBe(true);

            // Leg 2: Player 2 wins (score 75)
            state = {
                ...state,
                players: [
                    state.players[0],
                    { ...state.players[1], score: 75 }
                ]
            };
            result = dispatchMessage(state, { type: 'score', data: { value: 75 } });
            state = result.gameState;
            
            expect(state.players[1].legs).toBe(1);
            expect(state.players[0].isActive).toBe(true);

            // Leg 3: Player 1 wins (score 100)
            state = {
                ...state,
                players: [
                    { ...state.players[0], score: 100 },
                    state.players[1]
                ]
            };
            result = dispatchMessage(state, { type: 'score', data: { value: 100 } });
            state = result.gameState;
            
            expect(state.players[0].legs).toBe(2);
            expect(state.players[1].isActive).toBe(true);

            // Leg 4: Player 1 wins match (3-1 overall, first to 3)
            state = {
                ...state,
                players: [
                    { ...state.players[0], score: 150, legs: 2, isActive: true },
                    { ...state.players[1], isActive: false }
                ]
            };
            result = dispatchMessage(state, { type: 'score', data: { value: 150 } });
            state = result.gameState;
            
            expect(state.gameOver).toBe(true);
            expect(state.winner).toBe(0);
            expect(result.events.some(e => e.type === 'game_won')).toBe(true);
        });

        it('should handle close match with leg lead changes', () => {
            let state = createInitialGameState();
            state.firstTo = 2;

            // Start with player 2 active
            state.players[0].isActive = false;
            state.players[1].isActive = true;

            // Leg 1: Player 2 wins (0-1)
            state = {
                ...state,
                players: [
                    state.players[0],
                    { ...state.players[1], score: 100 }
                ]
            };
            let result = dispatchMessage(state, { type: 'score', data: { value: 100 } });
            state = result.gameState;
            expect(state.players[1].legs).toBe(1);

            // Leg 2: Player 1 wins (1-1)
            state = {
                ...state,
                players: [
                    { ...state.players[0], score: 75 },
                    state.players[1]
                ]
            };
            result = dispatchMessage(state, { type: 'score', data: { value: 75 } });
            state = result.gameState;
            expect(state.players[0].legs).toBe(1);
            expect(state.players[1].legs).toBe(1);

            // Leg 3: Player 2 wins (1-2, wins match)
            state = {
                ...state,
                players: [
                    state.players[0],
                    { ...state.players[1], score: 150, legs: 1 }
                ]
            };
            result = dispatchMessage(state, { type: 'score', data: { value: 150 } });
            state = result.gameState;
            
            expect(state.gameOver).toBe(true);
            expect(state.winner).toBe(1);
        });
    });

    // ===== STATE PERSISTENCE =====
    describe('State Persistence Across Rounds', () => {
        it('should maintain player names across rounds', () => {
            let state = createInitialGameState();
            
            // Update names
            let result = dispatchMessage(state, { type: 'updateName', data: { playerIndex: 0, name: 'Alice' } });
            state = result.gameState;
            result = dispatchMessage(state, { type: 'updateName', data: { playerIndex: 1, name: 'Bob' } });
            state = result.gameState;

            // Complete a leg
            state = { ...state, players: [{ ...state.players[0], score: 50 }, state.players[1]] };
            result = dispatchMessage(state, { type: 'score', data: { value: 50 } });
            state = result.gameState;

            // Names still there
            expect(state.players[0].name).toBe('Alice');
            expect(state.players[1].name).toBe('Bob');
        });

        it('should maintain firstTo setting across legs', () => {
            let state = createInitialGameState();
            state.firstTo = 5;

            // Play through a leg
            state = { ...state, players: [{ ...state.players[0], score: 100 }, state.players[1]] };
            let result = dispatchMessage(state, { type: 'score', data: { value: 100 } });
            state = result.gameState;

            // firstTo unchanged
            expect(state.firstTo).toBe(5);
        });

        it('should track leg wins across multiple legs', () => {
            let state = createInitialGameState();
            
            // Leg 1: P1 wins
            state = { ...state, players: [{ ...state.players[0], score: 50 }, state.players[1]] };
            let result = dispatchMessage(state, { type: 'score', data: { value: 50 } });
            state = result.gameState;
            expect(state.players[0].legs).toBe(1);

            // Leg 2: P2 wins
            state = { ...state, players: [state.players[0], { ...state.players[1], score: 75 }] };
            result = dispatchMessage(state, { type: 'score', data: { value: 75 } });
            state = result.gameState;
            expect(state.players[1].legs).toBe(1);

            // Leg 3: P1 wins
            state = { ...state, players: [{ ...state.players[0], score: 100 }, state.players[1]] };
            result = dispatchMessage(state, { type: 'score', data: { value: 100 } });
            state = result.gameState;
            expect(state.players[0].legs).toBe(2);
            expect(state.players[1].legs).toBe(1);
        });
    });

    // ===== EDGE CASES & BUST HANDLING =====
    describe('Bust Handling and Edge Cases', () => {
        it('should handle bust and allow retry', () => {
            let state = createInitialGameState();
            state = { ...state, players: [{ ...state.players[0], score: 10 }, state.players[1]] };

            // Attempt bust
            let result = dispatchMessage(state, { type: 'score', data: { value: 20 } });
            expect(result.events[0].type).toBe('bust');
            expect(result.gameState.players[0].score).toBe(10); // Unchanged

            // Retry with valid score
            result = dispatchMessage(result.gameState, { type: 'score', data: { value: 5 } });
            expect(result.gameState.players[0].score).toBe(5);
            expect(result.events[0].type).toBe('score_added');
        });

        it('should handle score = 1 as bust', () => {
            let state = createInitialGameState();
            state = { ...state, players: [{ ...state.players[0], score: 3 }, state.players[1]] };

            const result = dispatchMessage(state, { type: 'score', data: { value: 2 } });
            expect(result.events[0].type).toBe('bust');
        });

        it('should handle perfect finishes only', () => {
            // Score must equal 0 with double
            let state = createInitialGameState();
            state = { ...state, players: [{ ...state.players[0], score: 50 }, state.players[1]] };

            // Exactly 50 - checkout
            const result = dispatchMessage(state, { type: 'score', data: { value: 50 } });
            expect(result.gameState.players[0].legs).toBe(1);
        });

        it('should prevent actions after game over', () => {
            let state = createInitialGameState();
            state.gameOver = true;
            state.winner = 0;

            const result = dispatchMessage(state, { type: 'score', data: { value: 25 } });
            expect(result.events[0].type).toBe('error');
        });
    });

    // ===== PLAYER SWITCHING =====
    describe('Player Switching and Active State', () => {
        it('should switch active player after leg win', () => {
            let state = createInitialGameState();
            expect(state.players[0].isActive).toBe(true);

            state = { ...state, players: [{ ...state.players[0], score: 50 }, state.players[1]] };
            let result = dispatchMessage(state, { type: 'score', data: { value: 50 } });
            state = result.gameState;

            // Should switch
            expect(state.players[0].isActive).toBe(false);
            expect(state.players[1].isActive).toBe(true);
        });

        it('should alternate players through multiple legs', () => {
            let state = createInitialGameState();

            // Leg 1: P1 -> P2
            state = { ...state, players: [{ ...state.players[0], score: 50 }, state.players[1]] };
            let result = dispatchMessage(state, { type: 'score', data: { value: 50 } });
            state = result.gameState;
            expect(state.players[1].isActive).toBe(true);

            // Leg 2: P2 -> P1
            state = { ...state, players: [state.players[0], { ...state.players[1], score: 75 }] };
            result = dispatchMessage(state, { type: 'score', data: { value: 75 } });
            state = result.gameState;
            expect(state.players[0].isActive).toBe(true);
        });

        it('should handle explicit switchPlayer message', () => {
            let state = createInitialGameState();
            expect(state.players[0].isActive).toBe(true);

            const result = dispatchMessage(state, { type: 'switchPlayer' });
            expect(result.gameState.players[0].isActive).toBe(false);
            expect(result.gameState.players[1].isActive).toBe(true);
        });
    });

    // ===== AVERAGES & STATS =====
    describe('Average Calculation and Statistics', () => {
        it('should calculate correct average across multiple darts', () => {
            let state = createInitialGameState();

            // Score 60 should update average
            state = { ...state, players: [{ ...state.players[0], score: 441, dartsThrown: 0, totalScored: 0 }, state.players[1]] };
            
            let result = dispatchMessage(state, { type: 'score', data: { value: 60 } });
            state = result.gameState;

            // dartsThrown is 1 after first score, totalScored is 60
            // Average = (60 / 1) * 3 = 180
            expect(state.players[0].average).toBe(180);
            expect(state.players[0].dartsThrown).toBe(1);
            expect(state.players[0].totalScored).toBe(60);
        });

        it('should track total scored and darts thrown', () => {
            let state = createInitialGameState();
            state = { ...state, players: [{ ...state.players[0], score: 451, dartsThrown: 0, totalScored: 0 }, state.players[1]] };

            let result = dispatchMessage(state, { type: 'score', data: { value: 50 } });
            state = result.gameState;

            expect(state.players[0].totalScored).toBe(50);
            expect(state.players[0].dartsThrown).toBe(1); // Each score submission counts as one turn
        });
    });

    // ===== RESET FUNCTIONALITY =====
    describe('Game Reset', () => {
        it('should fully reset game to initial state', () => {
            let state = createInitialGameState();
            
            // Play some rounds
            state = { ...state, players: [{ ...state.players[0], score: 100, legs: 2 }, { ...state.players[1], score: 200, legs: 1 }] };

            // Reset
            const result = dispatchMessage(state, { type: 'resetGame' });
            state = result.gameState;

            expect(state.players[0].score).toBe(501);
            expect(state.players[1].score).toBe(501);
            expect(state.players[0].legs).toBe(0);
            expect(state.players[1].legs).toBe(0);
            expect(state.gameOver).toBe(false);
        });

        it('should preserve player names on reset', () => {
            let state = createInitialGameState();
            
            // Update names
            let result = dispatchMessage(state, { type: 'updateName', data: { playerIndex: 0, name: 'Alice' } });
            state = result.gameState;
            result = dispatchMessage(state, { type: 'updateName', data: { playerIndex: 1, name: 'Bob' } });
            state = result.gameState;

            // Play and reset
            state = { ...state, players: [{ ...state.players[0], score: 100, legs: 2 }, state.players[1]] };
            result = dispatchMessage(state, { type: 'resetGame' });
            state = result.gameState;

            expect(state.players[0].name).toBe('Alice');
            expect(state.players[1].name).toBe('Bob');
        });

        it('should preserve game settings on reset', () => {
            let state = createInitialGameState();
            state.firstTo = 5;
            state.startScore = 301;

            // Play and reset
            state = { ...state, players: [{ ...state.players[0], score: 100, legs: 2 }, state.players[1]] };
            const result = dispatchMessage(state, { type: 'resetGame' });
            state = result.gameState;

            expect(state.firstTo).toBe(5);
            expect(state.startScore).toBe(301);
        });
    });

    // ===== MESSAGE FLOW PATTERNS =====
    describe('Message Flow Patterns', () => {
        it('should handle rapid successive messages', () => {
            let state = createInitialGameState();
            const messages = [
                { type: 'score', data: { value: 20 } },
                { type: 'switchPlayer' },
                { type: 'score', data: { value: 25 } },
                { type: 'switchPlayer' }
            ];

            messages.forEach(msg => {
                const result = dispatchMessage(state, msg);
                state = result.gameState;
            });

            // After switch, switch, should be back at P1
            expect(state.players[0].isActive).toBe(true);
            expect(state.players[1].isActive).toBe(false);
        });

        it('should handle interleaved room messages correctly', () => {
            const room1State = createInitialGameState();
            const room2State = createInitialGameState();
            
            rooms.set('ROOM1', room1State);
            rooms.set('ROOM2', room2State);

            // Interleave messages from different rooms
            handleRoomMessage(rooms, 'ROOM1', { type: 'score', data: { value: 100 } }, []);
            handleRoomMessage(rooms, 'ROOM2', { type: 'score', data: { value: 50 } }, []);
            handleRoomMessage(rooms, 'ROOM1', { type: 'switchPlayer' }, []);
            handleRoomMessage(rooms, 'ROOM2', { type: 'switchPlayer' }, []);

            // Each room has correct state
            expect(rooms.get('ROOM1').players[0].score).toBe(401);
            expect(rooms.get('ROOM1').players[1].isActive).toBe(true);
            
            expect(rooms.get('ROOM2').players[0].score).toBe(451);
            expect(rooms.get('ROOM2').players[1].isActive).toBe(true);
        });

        it('should emit correct sequence of events for leg win', () => {
            let state = createInitialGameState();
            state = { ...state, players: [{ ...state.players[0], score: 50 }, state.players[1]] };

            const result = dispatchMessage(state, { type: 'score', data: { value: 50 } });

            // Should emit both leg_won and next_leg events
            expect(result.events.some(e => e.type === 'leg_won')).toBe(true);
            expect(result.events.some(e => e.type === 'next_leg')).toBe(true);
        });
    });

    // ===== TRANSACTION-LIKE BEHAVIOR =====
    describe('Transaction Safety', () => {
        it('should not partially update state on error', () => {
            let state = createInitialGameState();
            const originalState = JSON.stringify(state);

            // Try invalid update
            const result = dispatchMessage(state, { type: 'updateName', data: { playerIndex: 999, name: 'Invalid' } });

            // State unchanged
            expect(JSON.stringify(result.gameState)).toBe(originalState);
            expect(result.events[0].type).toBe('error');
        });

        it('should not corrupt state with null message', () => {
            let state = createInitialGameState();
            const originalState = JSON.stringify(state);

            const result = dispatchMessage(state, null);

            // State unchanged
            expect(JSON.stringify(result.gameState)).toBe(originalState);
        });
    });

    // ===== FIRST-TO VARIATIONS =====
    describe('First-To Variations', () => {
        it('should work with first-to-1 (single leg match)', () => {
            let state = createInitialGameState();
            state.firstTo = 1;

            state = { ...state, players: [{ ...state.players[0], score: 100 }, state.players[1]] };
            const result = dispatchMessage(state, { type: 'score', data: { value: 100 } });

            expect(result.gameState.gameOver).toBe(true);
            expect(result.gameState.winner).toBe(0);
        });

        it('should work with first-to-10 (long match)', () => {
            let state = createInitialGameState();
            state.firstTo = 10;

            // Ensure P1 is active
            state.players[0].isActive = true;

            // Simulate 10 leg wins for player 1
            for (let i = 0; i < 10; i++) {
                state = {
                    ...state,
                    players: [
                        { ...state.players[0], score: 100, legs: i, isActive: true },
                        { ...state.players[1], isActive: false }
                    ]
                };
                const result = dispatchMessage(state, { type: 'score', data: { value: 100 } });
                state = result.gameState;
            }

            expect(state.gameOver).toBe(true);
            expect(state.winner).toBe(0);
            expect(state.players[0].legs).toBe(10);
        });
    });
});
