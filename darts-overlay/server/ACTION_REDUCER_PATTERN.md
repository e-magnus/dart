# Action/Reducer Pattern Documentation

## Overview

The darts overlay system implements a clean **action/reducer pattern** for managing game state transitions. This pattern ensures:

- **Pure functions**: No side effects, deterministic outputs
- **Testability**: All state transitions can be tested without WebSocket
- **Predictability**: Given same input, always produces same output
- **Room isolation**: Multiple games don't interfere with each other

## Architecture

```
┌─────────────────────────────────────────────────────┐
│        WebSocket Server (server.js)                 │
│                                                     │
│  Client Connection → Room Management                │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
        ┌──────────────────────┐
        │ websocketDispatcher  │  (Message Routing)
        └──────────┬───────────┘
                   │
                   ↓
        ┌──────────────────────────────────────┐
        │      messageHandlers.js              │  (State Transformers)
        │  - handleAddScore                    │
        │  - handleSwitchPlayer                │
        │  - handleUpdatePlayerName            │
        │  - handleResetGame                   │
        └──────────┬───────────────────────────┘
                   │
                   ↓
        ┌──────────────────────┐
        │   gameLogic.js       │  (Game Rules)
        │  Pure functions      │
        └──────────────────────┘
                   │
                   ↓
            ┌─────────────┐
            │  Game State │  (Immutable)
            └─────────────┘
                   │
                   ↓
        ┌──────────────────────┐
        │  broadcastEvents     │  (Notification)
        │  Send to all clients │
        └──────────────────────┘
```

## Message Flow

### 1. Client Sends Action

```javascript
{
  type: 'score',
  data: { value: 25 }
}
```

### 2. Dispatcher Routes Message

```javascript
function dispatchMessage(gameState, message) {
  // Validates message structure
  // Routes to appropriate handler
  // Returns: { gameState, events }
}
```

### 3. Handler Transforms State

```javascript
function handleAddScore(gameState, dartValue) {
  // 1. Validate: Is game over? Do we have active player?
  // 2. Call: gameLogic functions for score calculation
  // 3. Mutate: Create new state object (never mutate original)
  // 4. Emit: Events describing what changed

  return {
    gameState: newState,
    events: [
      { type: 'score_added', data: {...} },
      { type: 'leg_won', data: {...} }  // if applicable
    ]
  };
}
```

### 4. Room State Updated

```javascript
// Room state in server.js
rooms.set(roomId, newGameState);
```

### 5. Events Broadcast

```javascript
function broadcastEvents(events, roomClients) {
  events.forEach(event => {
    const message = JSON.stringify({
      type: 'stateUpdate',
      event: event.type,
      data: event.data,
      timestamp: Date.now(),
    });

    roomClients.forEach(client => {
      if (client.readyState === 1) {
        // OPEN
        client.send(message);
      }
    });
  });
}
```

## Message Types & Handlers

### `score` - Add Dart Score

**Input:**

```javascript
{ type: 'score', data: { value: 25 } }
```

**Processing:**

1. Validate game not over
2. Get active player
3. Call `gameLogic.addDartScore(currentScore, dartValue)`
4. Check for bust, checkout, leg win, game win
5. Update state accordingly

**Events Emitted:**

- `score_added` - Normal score
- `bust` - Score would go below 0 or equal 1
- `leg_won` - Exact checkout (0 remaining)
- `next_leg` - Reset for next leg, switch player
- `game_won` - Player reached required legs to win

### `switchPlayer` - Toggle Active Player

**Input:**

```javascript
{
  type: 'switchPlayer';
}
```

**Events Emitted:**

- `player_switched` - Active player toggled

### `updateName` - Change Player Name

**Input:**

```javascript
{ type: 'updateName', data: { playerIndex: 0, name: 'Alice' } }
```

**Validation:**

- `playerIndex` must be 0 or 1
- `name` must be string

**Events Emitted:**

- `name_updated` - Player name changed

### `resetGame` - Reset Game State

**Input:**

```javascript
{
  type: 'resetGame';
}
```

**Preserves:**

- Player names
- Start score (usually 501)
- First-to setting

**Resets:**

- Legs to 0
- Scores to start score
- Game over flag
- Active player to player 1

**Events Emitted:**

- `game_reset` - Game state reset

### `ping` - Connection Keepalive

**Input:**

```javascript
{
  type: 'ping';
}
```

**Events Emitted:**

- `pong` - With timestamp

## State Structure

```javascript
{
  // Players
  players: [
    {
      name: 'Player 1',
      score: 501,              // Remaining points
      legs: 0,                 // Legs won
      sets: 0,                 // Not currently used
      isActive: true,          // Whose turn?
      dartsThrown: 0,          // Total darts thrown
      totalScored: 0,          // Sum of all dart scores
      average: 0               // PPD (points per dart) * 3
    },
    // ... player 2
  ],

  // Game Settings
  firstTo: 3,                  // Win match at N legs
  startScore: 501,             // Game starting points

  // Game Status
  history: [],                 // Turn history (future)
  gameOver: false,             // Match finished?
  winner: null,                // Winning player index
  lastLegWinner: null,         // Last leg winner
  lastSetWinner: null,         // Not used
  nextLegStartPlayer: 1        // Who starts next leg
}
```

## Event Types

Events describe what happened as a result of processing a message:

| Event             | Data                                   | Notes                    |
| ----------------- | -------------------------------------- | ------------------------ |
| `score_added`     | `{ playerIndex, newScore, dartValue }` | Normal score             |
| `bust`            | `{ playerIndex, attemptedScore }`      | Invalid score, no change |
| `leg_won`         | `{ playerIndex, legs }`                | Exact checkout (0)       |
| `next_leg`        | `{ activePlayerIndex }`                | Reset for next leg       |
| `game_won`        | `{ playerIndex }`                      | Matched required legs    |
| `player_switched` | `{ activePlayerIndex }`                | Active player changed    |
| `name_updated`    | `{ playerIndex, newName }`             | Player name changed      |
| `game_reset`      | `{ startScore, firstTo }`              | Full reset               |
| `pong`            | `{ timestamp }`                        | Connection alive         |
| `error`           | `{ message }`                          | Invalid input/state      |

## Testing Without WebSocket

The pattern allows complete testing of game logic without WebSocket:

```javascript
// Test score addition
let state = createInitialGameState();
const { gameState, events } = dispatchMessage(state, {
  type: 'score',
  data: { value: 100 },
});

expect(gameState.players[0].score).toBe(401);
expect(events[0].type).toBe('score_added');

// Test leg win
state = { ...gameState, players: [{ ...gameState.players[0], score: 50 }, gameState.players[1]] };
const legWinResult = dispatchMessage(state, { type: 'score', data: { value: 50 } });
expect(legWinResult.gameState.gameOver).toBe(false);
expect(legWinResult.events.some(e => e.type === 'leg_won')).toBe(true);
```

## Room Isolation

Each room has independent state managed in `server.js`:

```javascript
// Multiple rooms, no interference
const rooms = new Map();
rooms.set('room-1', initialState);
rooms.set('room-2', initialState);

handleRoomMessage(rooms, 'room-1', message, roomClients1);
// Only room-1 state updates
```

## Best Practices

1. **Never mutate input state** - Always clone before modifying

   ```javascript
   const newState = JSON.parse(JSON.stringify(gameState));
   ```

2. **Emit events for all changes** - Clients depend on events

   ```javascript
   return { gameState, events: [{ type: '...', data: {...} }] };
   ```

3. **Validate inputs early** - Return error event if invalid

   ```javascript
   if (invalid) {
     return { gameState, events: [{ type: 'error', data: '...' }] };
   }
   ```

4. **Maintain state consistency** - Handle cascading changes

   ```javascript
   // Leg win: reset score AND switch player
   newPlayer.score = newState.startScore;
   switchActivePlayer(newState);
   ```

5. **Test state transitions** - Use action/reducer pattern
   ```javascript
   // All state changes testable without server
   const result = dispatchMessage(state, message);
   ```

## Adding New Actions

To add a new action type:

1. **Create handler** in `messageHandlers.js`:

   ```javascript
   function handleNewAction(gameState, data) {
     // Validate
     // Transform state
     // Return { gameState, events }
   }
   ```

2. **Add case** in `dispatchMessage()`:

   ```javascript
   case 'newAction': {
     result = handleNewAction(gameState, data);
     break;
   }
   ```

3. **Write tests** in `websocketDispatcher.test.js`:

   ```javascript
   it('should handle new action', () => {
     const { gameState, events } = dispatchMessage(initialState, message);
     // Assertions
   });
   ```

4. **Export handler** from `messageHandlers.js`:
   ```javascript
   module.exports = {
     // ... existing
     handleNewAction,
   };
   ```

## Summary

The action/reducer pattern provides:

- ✅ **Pure functions** for all state transitions
- ✅ **Complete testability** without WebSocket
- ✅ **Event-driven architecture** for broadcasting
- ✅ **Room isolation** for multi-game support
- ✅ **Extensibility** for adding new actions
- ✅ **Predictability** - deterministic state changes
