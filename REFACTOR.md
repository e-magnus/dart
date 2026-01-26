# Refactor Plan: Darts Overlay Control Logic

## Objective
Restructure control panel and server logic to improve testability, maintainability, and separation of concerns without breaking game functionality.

## Phase 1: Isolated Game Logic (DONE)
- ✅ Created `gameLogic.js` with pure functions
- ✅ Added comprehensive unit tests (19 passing)
- ✅ Verified mutation safety

## Phase 2: Event Handling Layer (NEXT)
- Extract WebSocket message handlers into separate module
- Create consistent action/reducer pattern
- Test all state transitions without WebSocket

## Phase 3: Control Panel Refactor
- Separate DOM manipulation from game state
- Create state management layer
- Split control.js into:
  - `gameState.js` (state management)
  - `handlers.js` (event handlers)
  - `ui.js` (DOM updates)
  - `index.js` (initialization)

## Phase 4: Server Integration Tests
- Test game state mutations on incoming messages
- Verify room isolation
- Test win conditions and leg resets

## Testing Strategy
- Unit tests for all pure functions
- Integration tests for message flow
- Smoke tests for UI with sample data
- Run `npm test` and `npm run test:watch` during refactoring

## Safety Checks
Before each commit:
```bash
npm test                  # All tests pass
npm run test:coverage     # Coverage check
# Manual: Start server, test score input, bust, leg/game win, names
```

## Branch Management
- `refactor/control-logic` - Main refactoring branch
- Push regularly to remote
- PR to `main` when complete and tested

## Notes
- Maintain backwards compatibility with current WebSocket API
- No breaking changes to overlay or control panel UX
- Green tests gate all merges
