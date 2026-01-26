# User-Facing Messages Reference

Quick reference for all user-visible text strings in the darts overlay system.

## Toast Notifications

| Message | Location | Purpose |
|---------|----------|---------|
| `Overlay opnað!` | [control/control.js:242](control/control.js#L242) | Shown when overlay window opens |
| `Stillingar vistaðar!` | [control/control.js:257](control/control.js#L257) | Shown after saving settings |
| `Umferð búin, bíddu eftir næstu umferð...` | [control/control.js:502](control/control.js#L502) | Shown when trying to throw after 3 darts |
| `Þú verð að enda með double eða bull (25/50)!` | [control/control.js:547](control/control.js#L547) | Shown when finishing without valid double |

## Bust Modal

| Message | Location | Purpose |
|---------|----------|---------|
| `SPRUNGINN!` | [control/control.html:37](control/control.html#L37) | Modal title |
| `Skor: {current} − {thrown} = 1` | [control/control.js:217](control/control.js#L217) | Bust message when score = 1 |
| `Skor: {current} − {thrown} = {newScore}` | [control/control.js:219](control/control.js#L219) | General bust message |
| `HALDA ÁFRAM` | [control/control.html:40](control/control.html#L40) | Continue button |

## Undo Round Modal

| Message | Location | Purpose |
|---------|----------|---------|
| `Afturkalla?` | [control/control.html:45](control/control.html#L45) | Modal title |
| `Þú ert að fara að afturkalla heila umferð.` | [control/control.html:47](coJárlay.html#L20) | Score column header |
| `🎯` | [overlay/overlay.js:167-173](overlay/overlay.js#L167) | Active player indicator |
| `🏆` | [overlay/overlay.js:150-157](overlay/overlay.js#L150) | Match winner indicator |

## Dynamic Content Format

| Format | Location | Description |
|--------|----------|-------------|
| `D{value}` | [control/control.js:412](control/control.js#L412) | Double prefix |
| `T{value}` | [control/control.js:412](control/control.js#L412) | Triple prefix |
| `{score}` | [control/control.js:433](control/control.js#L433) | Running total display |
| `Avg: {avg} ({darts})` | [control/control.js:449](control/control.js#L449) | Average with darts thrown |
| `({darts})` | [overlay/overlay.js:122](overlay/overlay.js#L122) | Darts thrown suffix |

## Notes

- Most messages are in Icelandic
- Dynamic content (player names, scores, etc.) is injected at runtime
- Emojis (🎯, 🏆, 🎉) are used for visual indicators
- Messages use HTML formatting (`<br>`) where needed for multi-line display

## Quick Edit Guide

To change a message:
1. Find the message in the table above
2. Click the link to jump to the source location
3. Edit the string in quotes
4. Save and refresh the control panel/overlay

For example, to change "SPRUNGINN!" to "BUST!":
- Open `control/control.html`
- Go to line 37
- Change `<h2>SPRUNGINN!</h2>` to `<h2>BUST!</h2>`
