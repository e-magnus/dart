# Darts Overlay Kerfi
OBS Overlay fyrir Dart mót - Fullkomið kerfi fyrir útsendingar

## Um verkefnið

Þetta er fullkomið, offline darts stigatafla og OBS sendingar-overlay kerfi fyrir samkeppnisleiki í dartum. Byggt með Node.js og WebSockets fyrir rauntíma samstillingu.

## Aðal eiginleikar

🎯 **Gumma Lilla gefur góð ráð** - Rauntíma checkout tillögur (2-170)  
📊 **Stigatafla í rauntíma** - WebSocket samstilling  
🎨 **OBS-tilbúið** - 1920x1080 gagnsætt overlay  
⌨️ **Flýtilyklar** - Fljótlegt stiga innsláttur  
📱 **2-4 leikmenn** - Fullur stuðningur  
✅ **100% Offline** - Engar ytri tengingar  

## Skjöl

Nákvæm leiðbeiningar eru í: [darts-overlay/README.md](darts-overlay/README.md)

## Fljótleg byrjun

```bash
# Setja upp
npm install

# Ræsa serverinn
npm start

# Keyra testa
npm test
```

## Skráarskipan

- `darts-overlay/` - Aðal kerfið
  - `server/` - WebSocket server
  - `overlay/` - OBS overlay
  - `control/` - Stjórnborð + Gumma Lilla
- `jest.config.js` - Test stillingar
- `package.json` - Dependencies

---

Sjá [darts-overlay/README.md](darts-overlay/README.md) fyrir ítarlegar upplýsingar.
