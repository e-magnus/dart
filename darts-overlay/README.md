# Darts 501 Overlay System

A complete, offline darts scoreboard and OBS broadcast overlay system for competitive dart matches. Built with Node.js and WebSockets for real-time synchronization.

## Features

✅ **Broadcast Quality**
- 1920x1080 OBS-compatible transparent overlay
- TV-style dark scoreboard design with green/yellow styling
- Smooth CSS animations (win flash, score updates, player indicator)

✅ **Game Logic**
- Darts 501 with configurable first-to (legs)
- 2-player support with live name editing
- Bust detection (score < 0 or = 1)
- Exact checkout detection with automatic leg reset
- Win animation when game is completed

✅ **Smart Features**
- Real-time checkout suggestions (≤170) from local lookup table
- Live score updates via WebSocket
- Active player indicator with pulse animation
- Undo last throw functionality
- Manual reset option

✅ **Control Panel**
- Quick score buttons (0, 3, 6...180)
- Custom score input with keyboard support
- Hotkeys: Numbers (input), Space (switch), U (undo), Enter (submit)
- Edit player names live
- Edit first-to value
- Current game status display

✅ **100% Offline**
- No cloud services
- No external APIs or dependencies
- Everything runs on localhost
- Works completely offline once started

## System Requirements

- **Windows 11** (also works on Windows 10, macOS, Linux)
- **Node.js** 14+ (https://nodejs.org/)
- **OBS Studio** (https://obsproject.com/) - for broadcast overlay

## Installation

1. **Extract the project** to your desired location
2. **Open Command Prompt** or PowerShell in the project directory
3. **Install dependencies:**
   ```
   npm install
   ```

## Quick Start

### Option 1: Using the Batch File (Windows)
Simply double-click `start.bat` - it will:
- Start the WebSocket server
- Open the control panel in your browser
- Display connection instructions

### Option 2: Manual Start
```bash
npm start
```

This starts the server at `ws://127.0.0.1:8080`

## Usage

### 1. Start the Server
```bash
npm start
```
You should see:
```
Darts Overlay Server running at ws://127.0.0.1:8080
Press Ctrl+C to stop
```

### 2. Open Control Panel
Navigate to: `file:///path/to/darts-overlay/control/control.html`

Or let `start.bat` open it automatically.

### 3. Set Up OBS Overlay
1. Open OBS Studio
2. In your scene, add a **Browser** source:
   - **URL:** `file:///path/to/darts-overlay/overlay/overlay.html`
   - **Width:** 1920
   - **Height:** 1080
   - Check "Use custom frame rate"
3. The overlay is transparent - layer it over your game/stream content
4. Start streaming/recording!

## Control Panel Guide

### Score Input
- **Quick buttons:** Click for common scores (0, 3, 6, 9... 180)
- **Manual input:** Type any number 0-180, press Enter
- **Hotkeys:**
  - `0`-`9`: Type digits
  - `Enter`: Confirm score
  - `Space`: Switch to next player
  - `U`: Undo last throw

### Player Settings
- Edit player names anytime (updates live)
- Change "First To" value (1-20 legs)
- Reset entire game with confirmation

### Status Display
Shows current active player, score, legs won, and game status.

## Game Rules Implemented

**Darts 501:**
- Players start at 501 points
- Each throw reduces score
- First player to exactly 0 wins the leg
- Bust: Score < 0 or = 1 → throw doesn't count, stay at same score
- Score = 1 is invalid (can't finish on double)
- Winning leg requires exact checkout
- After each leg win, score resets to 501
- First to N legs wins the match

## Overlay Display

The OBS overlay shows:
- **Player names** with editable live names
- **Current scores** (remaining points)
- **Legs won** for each player
- **Active player indicator** (pulsing green dot)
- **Checkout suggestion** (e.g., "T20 T20 Bull")
- **Win animation** when game ends
- **First-to value** in center

Colors:
- Green (#00ff00) - Primary
- Yellow (#ffff00) - Highlights/suggestions
- Dark background - TV-style

## File Structure

```
darts-overlay/
├─ server/
│  ├─ server.js           # WebSocket server + game logic
│  └─ checkouts.json      # Checkout suggestions (2-170)
├─ overlay/
│  ├─ overlay.html        # OBS browser source
│  ├─ overlay.css         # TV-style design + animations
│  └─ overlay.js          # WebSocket client
├─ control/
│  ├─ control.html        # Score input UI
│  ├─ control.css         # Modern dark theme
│  └─ control.js          # Game control logic
├─ package.json           # Dependencies
├─ start.bat              # Windows launcher
└─ README.md              # This file
```

## Keyboard Shortcuts (Control Panel)

| Key | Action |
|-----|--------|
| `0`-`9` + `Enter` | Input custom score |
| `Space` | Switch active player |
| `U` | Undo last throw |
| `Enter` | Submit score |

## WebSocket API

The server communicates via WebSocket on port 8080.

### Client → Server Messages

**Add Score**
```json
{ "type": "score", "playerIndex": 0, "value": 20 }
```

**Switch Player**
```json
{ "type": "switchPlayer" }
```

**Undo Last Action**
```json
{ "type": "undo" }
```

**Reset Game**
```json
{ "type": "resetGame" }
```

**Update Player Name**
```json
{ "type": "updateName", "playerIndex": 0, "name": "John" }
```

**Update First-To**
```json
{ "type": "updateFirstTo", "value": 5 }
```

### Server → Client Messages

**State Update**
```json
{
  "type": "stateUpdate",
  "data": {
    "players": [
      { "name": "Player 1", "score": 501, "legs": 0, "isActive": true },
      { "name": "Player 2", "score": 501, "legs": 0, "isActive": false }
    ],
    "firstTo": 5,
    "gameOver": false,
    "winner": null,
    "checkoutSuggestion": "T20 T20 Bull",
    "history": []
  }
}
```

## Troubleshooting

**Q: Overlay is blank in OBS**
- Ensure server is running: `npm start`
- Check browser console in OBS (right-click source → Filters → Show in Interact)
- Verify URL is correct
- Try opening overlay.html in regular browser first

**Q: Control panel won't connect**
- Start the server first: `npm start`
- Check that port 8080 is not in use
- Try opening DevTools console (F12) to see connection errors

**Q: Scores not updating**
- Refresh both control panel and OBS source
- Restart the server

**Q: "Port already in use" error**
- Another app is using port 8080
- Change the PORT in server.js to something else (e.g., 8081)

## Performance Notes

- Runs at 60fps capable with smooth WebSocket updates
- Minimal CPU/GPU usage (CSS animations only, no video encoding)
- ~50KB total data for all assets
- Works on standard Windows 11 laptop hardware

## Customization

### Change Server Port
Edit `server/server.js` line 5:
```javascript
const PORT = 8080; // Change this
```

Then update WebSocket URLs in:
- `overlay/overlay.js` line 1
- `control/control.js` line 1

### Modify Overlay Colors
Edit `overlay/overlay.css` - search for color values:
- `#00ff00` = Green
- `#ffff00` = Yellow
- Adjust as needed

### Adjust Overlay Size
OBS browser source settings - change Width/Height

## License

MIT License - Use freely for personal and commercial projects

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review the README and documentation
3. Check browser console (F12) for errors
4. Restart the server and refresh pages

---

**Enjoy your darts overlay! 🎯**
