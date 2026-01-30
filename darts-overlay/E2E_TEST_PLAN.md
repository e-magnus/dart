# E2E Test Plan (Manual)

This checklist validates multi‑player support (1–4) and bull‑up ordering.

## Setup

1. Ensure the server is running on port 8080.
2. Open Control Panel: http://localhost:8080/control/control.html
3. Open Overlay: http://localhost:8080/overlay/overlay.html?roomId=<ROOM_ID>
   - Use the Room ID shown in the control panel footer.

## Core Scenarios

### 1 Player

- New Game → set player count to 1 → set name → Start.
- Verify control shows exactly 1 player card.
- Verify overlay shows exactly 1 player row.
- Enter a score and confirm updates in both control and overlay.

### 2 Players

- New Game → player count 2 → names → Start.
- Verify turn switching toggles active state between the two players.
- Verify overlay active indicator switches correctly.

### 3 Players

- New Game → player count 3 → names → Start.
- Verify 3 player cards/rows render.
- Switch player multiple times: active should rotate 1 → 2 → 3 → 1.

### 4 Players

- New Game → player count 4 → names → Start.
- Verify 4 player cards/rows render.
- Switch player multiple times: active should rotate through all 4.

## Bull‑Up Ordering

- New Game → player count 3 or 4 → check “bull‑up” → Start.
- Confirm all players are inactive while bull‑up is active.
- Simulate bull‑up throws (score messages) for each player.
- Verify player order is updated and first player is active after completion.

## UX Regression Checks

- Click‑to‑edit names in control panel updates overlay.
- “Cancel” in New Game restores previous settings.
- “Rematch” preserves player count and names.

## Pass/Fail Notes

Record any failures with steps, expected, and actual behavior.
