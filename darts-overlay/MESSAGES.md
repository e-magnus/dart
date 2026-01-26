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
| `Þú ert að fara að afturkalla heila umferð.` | [control/control.html:47](control/control.html#L47) | Explanation text |
| `Hætta við` | [control/control.html:50](control/control.html#L50) | Cancel button |
| `Afturkalla umferð` | [control/control.html:51](control/control.html#L51) | Confirm button |

## Leg/Game Win Modals

| Message | Location | Purpose |
|---------|----------|---------|
| `Næsti Leggur` | [control/control.html:17](control/control.html#L17) | Continue button after leg win |
| `${winner} vann legginn!<br>${p1Legs} - ${p2Legs}<br>(Fyrsti til að vinna ${firstTo})` | [control/control.js:120](control/control.js#L120) | Leg win message |
| `🎉 ${winner} vann leikinn! 🎉<br>${p1Legs} - ${p2Legs}` | [control/control.js:115](control/control.js#L115) | Match win message |
| `Nýr leikur` | [control/control.js:116](control/control.js#L116) | Button after match win |
| `Leik lokið` | [control/control.html:24](control/control.html#L24) | Game win options header |
| `${winnerName} vann leikinn!` | [control/control.js:159](control/control.js#L159) | Game win options text |
| `Spila aftur` | [control/control.html:27](control/control.html#L27) | Rematch button |

## New Game Modal

| Message | Location | Purpose |
|---------|----------|---------|
| `Nýr Leikur` | [control/control.html:68](control/control.html#L68) | Modal header |
| `Leikmaður 1:` | [control/control.html:72](control/control.html#L72) | Player 1 label |
| `Leikmaður 2:` | [control/control.html:77](control/control.html#L77) | Player 2 label |
| `Leikur:` | [control/control.html:81](control/control.html#L81) | Game type label |
| `501` | [control/control.html:85](control/control.html#L85) | 501 option |
| `301` | [control/control.html:89](control/control.html#L89) | 301 option |
| `Leggir til að vinna:` | [control/control.html:94](control/control.html#L94) | First-to label |
| `Byrja nýjan leik` | [control/control.html:98](control/control.html#L98) | Start button |

## Control Panel UI

| Message | Location | Purpose |
|---------|----------|---------|
| `UMFERÐ` | [control/control.html:57](control/control.html#L57) | Round header |
| `LIVE` | [control/control.html:58](control/control.html#L58) | Live indicator |
| `Nýr leikur` | [control/control.html:59](control/control.html#L59) | Header button |
| `PÍLA 1` | [control/control.js:75](control/control.js#L75) | Dart 1 label |
| `PÍLA 2` | [control/control.js:76](control/control.js#L76) | Dart 2 label |
| `PÍLA 3` | [control/control.js:77](control/control.js#L77) | Dart 3 label |
| `Skor í þessari umferð:` | [control/control.html:80](control/control.html#L80) | Round total label |
| `MISS` | [control/control.js:560](control/control.js#L560) | Miss dart text |
| `DOUBLE` | [control/control.html:116](control/control.html#L116) | Double multiplier |
| `TRIPLE` | [control/control.html:117](control/control.html#L117) | Triple multiplier |
| `STAÐFESTA UMFERÐ` | [control/control.html:118](control/control.html#L118) | Submit round button |
| `AFTURKALLA PÍLU` | [control/control.html:124](control/control.html#L124) | Undo dart button |
| `Avg: {avg} ({darts})` | [control/control.js:449](control/control.js#L449) | Average format |

## Overlay Display

| Message | Location | Purpose |
|---------|----------|---------|
| `{score} - {firstTo} leggir til sigurs` | [overlay/overlay.js:268](overlay/overlay.js#L268) | Heading (plural) |
| `{score} - 1 leggur til sigurs` | [overlay/overlay.js:266](overlay/overlay.js#L266) | Heading (singular) |
| `AVG` | [overlay/overlay.html:18](overlay/overlay.html#L18) | Average column header |
| `LEGGIR` | [overlay/overlay.html:19](overlay/overlay.html#L19) | Legs column header |
| `SKOR (P)` | [overlay/overlay.html:20](overlay/overlay.html#L20) | Score column header |
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
