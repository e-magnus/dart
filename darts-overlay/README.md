# Darts 501 Overlay Kerfi

Fullkomið, offline darts stigatafla og OBS sendingar-overlay kerfi fyrir samkeppnisleiki í dartum. Byggt með Node.js og WebSockets fyrir rauntíma samstillingu.

## Eiginleikar

✅ **Útsendingargæði**
- 1920x1080 OBS-samhæft gagnsætt overlay
- Sjónvarps-stíll dökk stigatafla með grænu/gulu útliti
- Mjúkar CSS animations (sigur-blikk, stig uppfærslur, leikmaður-vísar)

✅ **Leikjareglur**
- Darts 501 með stillanlegum "fyrsta-til" (legs)
- 2-4 leikmanna stuðningur með lifandi nafna breytingum
- Bust greining (stig < 0 eða = 1)
- Nákvæm checkout greining með sjálfvirkri leg endurstillingu
- Sigur animation þegar leik lýkur

✅ **Gáfaðir Eiginleikar**
- **Gumma Lilla gefur góð ráð 🎯** - rauntíma checkout tillögur (2-170) frá staðbundinni töflu
- Lifandi stig uppfærslur í gegnum WebSocket
- Virkur leikmaður vísar með púls animation
- Afturkalla síðasta kast
- Handvirk endurstilling

✅ **Stjórnborð**
- Fljótlegir stiga takkar (0, 3, 6...180)
- Sérsniðin stiga innsláttur með lyklaborðs stuðningi
- Flýtilyklar: Tölur (innsláttur), Space (skipta), U (afturkalla), Enter (staðfesta)
- Breyta nöfnum leikmanna í rauntíma
- Breyta "fyrsta-til" gildi
- Núverandi leikjastaða sýning

✅ **100% Offline**
- Engar skýjaþjónustur
- Engin ytri API eða tengsl
- Allt keyrir á localhost
- Virkar algjörlega offline þegar ræst

## Kerfiskröfur

- **Windows 11** (virkar einnig á Windows 10, macOS, Linux)
- **Node.js** 14+ (https://nodejs.org/)
- **OBS Studio** (https://obsproject.com/) - fyrir sendingar-overlay

## Uppsetning

1. **Afþjappaðu verkefnið** á þína æskilegu staðsetningu
2. **Opnaðu Command Prompt** eða PowerShell í verkefnamöppunni
3. **Settu upp dependencies:**
   ```bash
   npm install
   ```

## Fljótleg Byrjun

### Val 1: Nota Batch File (Windows)
Einfaldlega tvísmelltu á `start.bat` - það mun:
- Ræsa WebSocket serverinn
- Opna stjórnborðið í vafranum þínum
- Sýna tengingar leiðbeiningar

### Val 2: Handvirk Ræsing
```bash
npm start
```

Þetta ræsir serverinn á `ws://127.0.0.1:8080`

## Notkun

### 1. Ræstu Serverinn
```bash
npm start
```
Þú ættir að sjá:
```
Darts Overlay Server running
  Local:    ws://127.0.0.1:8080
  Network:  ws://0.0.0.0:8080
Press Ctrl+C to stop
```

### 2. Opnaðu Stjórnborðið
Farðu á: `file:///path/to/darts-overlay/control/control.html`

Eða láttu `start.bat` opna það sjálfkrafa.

### 3. Settu upp OBS Overlay
1. Opnaðu OBS Studio
2. Í senunni þinni, bættu við **Browser** source:
   - **URL:** `file:///path/to/darts-overlay/overlay/overlay.html`
   - **Width:** 1920
   - **Height:** 1080
   - Hakaðu við "Use custom frame rate"
3. Overlay-ið er gagnsætt - lagaðu það yfir leik/straum efnið þitt
4. Byrjaðu að senda/taka upp!

## Stjórnborð Leiðarvísir

### Stiga Innsláttur
- **Fljótlegir takkar:** Smelltu fyrir algeng stig (0, 3, 6, 9... 180)
- **Handvirkur innsláttur:** Sláðu inn hvaða tölu sem er 0-180, ýttu á Enter
- **Flýtilyklar:**
  - `0`-`9`: Slá inn tölustafi
  - `Enter`: Staðfesta stig
  - `Space`: Skipta yfir á næsta leikmann
  - `U`: Afturkalla síðasta kast

### Leikmaðar Stillingar
- Breyttu nöfnum leikmanna hvenær sem er (uppfærist í rauntíma)
- Breyttu "Fyrsta Til" gildi (1-20 legs)
- Endurstilltu allan leik með staðfestingu

### Staða Sýning
Sýnir núverandi virkan leikmann, stig, legs unnið, og leikjarstöðu.

### Gumma Lilla 🎯
- Virkjaðu í nýjum leik með því að haka við "Gumma Lilla gefur góð ráð 🎯"
- Fær checkout tillögur fyrir stig 2-170
- Sýnir "Gumma Lilla ráðlegur þér að skora sem flest stig!" þegar engin checkout eru möguleg
- Uppfærist sjálfkrafa eftir hvert kast
- Bogey numbers (159, 162, 163, 165, 166, 168, 169) sýna uppsetningu í stað beinna útganga

## Leikjareglur

**Darts 501:**
- Leikmenn byrja með 501 stig
- Hvert kast dregur frá stigum
- Fyrsti leikmaðurinn til nákvæmlega 0 vinnur leg-ið
- Bust: Stig < 0 eða = 1 → kastið telur ekki, sitja áfram á sömu stigum
- Stig = 1 er ógilt (get ekki klárað á tvöfaldri)
- Að vinna leg krefst nákvæmrar checkout
- Eftir hvert leg sigur, endurstillast stig á 501
- Fyrsti til N legs vinnur leikinn

## Overlay Sýning

OBS overlay-ið sýnir:
- **Nöfn leikmanna** með breytanleg rauntíma nöfn
- **Núverandi stig** (stig sem eftir eru)
- **Legs unnið** fyrir hvern leikmann
- **Virkur leikmaður vísar** (púlsandi grænn punktur)
- **Gumma Lilla tillaga** (t.d., "**T20**, **T20**, **DB**" með feitletruðum tölum)
- **Sigur animation** þegar leik lýkur
- **Fyrsta-til gildi** í miðju

Litir:
- Grænn (#26d07c) - Aðal
- Gulur (#ffff00) - Áherslur/tillögur
- Dökkur bakgrunnur - Sjónvarps-stíll

## Skráarskipan

```
darts-overlay/
├─ server/
│  ├─ server.js              # WebSocket server
│  ├─ gameLogic.js            # Leikjareglu útfærsla
│  ├─ messageHandlers.js      # WebSocket skilaboða handlers
│  ├─ websocketDispatcher.js  # Message routing
│  └─ __tests__/              # Server testar
├─ overlay/
│  ├─ overlay.html            # OBS browser source
│  ├─ overlay.css             # Sjónvarps-stíll hönnun + animations
│  ├─ overlay.js              # WebSocket client
│  └─ __tests__/              # Overlay testar
├─ control/
│  ├─ control.html            # Stiga innsláttur UI
│  ├─ control.css             # Nútímalegur dökkur þema
│  ├─ control.js              # Leikja stjórnar rökfræði
│  ├─ checkoutAdvice.js       # Gumma Lilla checkout töflur (2-170)
│  ├─ gameState.js            # Staða stjórnun
│  ├─ handlers.js             # Event handlers
│  ├─ ui.js                   # UI uppfærslur
│  └─ __tests__/              # Control testar
├─ package.json               # Dependencies
├─ jest.config.js             # Test stillingar
├─ start.bat                  # Windows launcher
└─ README.md                  # Þessi skrá
```

## Lyklaborðs Flýtilyklar (Stjórnborð)

| Lykill | Aðgerð |
|--------|--------|
| `0`-`9` + `Enter` | Slá inn sérsniðin stig |
| `Space` | Skipta um virkan leikmann |
| `U` | Afturkalla síðasta kast |
| `Enter` | Staðfesta stig |

## WebSocket API

Serverinn samskiptar í gegnum WebSocket á port 8080.

### Client → Server Skilaboð

**Bæta við Stigum**
```json
{ 
  "type": "score", 
  "playerIndex": 0, 
  "value": 60, 
  "darts": 3 
}
```

**Skipta um Leikmann**
```json
{ "type": "switchPlayer" }
```

**Afturkalla Síðustu Aðgerð**
```json
{ "type": "undo" }
```

**Endurstilla Leik**
```json
{ "type": "resetGame" }
```

**Uppfæra Nafn Leikmanns**
```json
{ 
  "type": "updateName", 
  "playerIndex": 0, 
  "name": "Jón Jónsson" 
}
```

**Uppfæra Fyrsta-Til**
```json
{ 
  "type": "updateFirstTo", 
  "value": 5 
}
```

**Uppfæra Leiktegund**
```json
{ 
  "type": "updateGameType", 
  "value": "501" 
}
```

### Server → Client Skilaboð

**Staða Uppfærsla**
```json
{
  "type": "stateUpdate",
  "data": {
    "players": [
      { 
        "name": "Leikmaður 1", 
        "score": 441, 
        "legs": 1, 
        "isActive": true,
        "totalScored": 60,
        "dartsThrown": 3,
        "average": 60.0
      },
      { 
        "name": "Leikmaður 2", 
        "score": 501, 
        "legs": 0, 
        "isActive": false,
        "totalScored": 0,
        "dartsThrown": 0,
        "average": 0
      }
    ],
    "firstTo": 3,
    "gameType": "501",
    "gameOver": false,
    "winner": null,
    "history": []
  }
}
```

## Bilanaleit

**S: Overlay er autt í OBS**
- Gakktu úr skugga um að serverinn sé að keyra: `npm start`
- Athugaðu browser console í OBS (hægri-smelltu á source → Interact)
- Staðfestu að URL sé rétt
- Reyndu að opna overlay.html í venjulegum vafra fyrst

**S: Stjórnborð tengist ekki**
- Ræstu serverinn fyrst: `npm start`
- Athugaðu að port 8080 sé ekki í notkun
- Reyndu að opna DevTools console (F12) til að sjá tengingar villur

**S: Stig uppfærast ekki**
- Endurnýjaðu bæði stjórnborð og OBS source
- Endurræstu serverinn

**S: "Port already in use" villa**
- Annað forrit er að nota port 8080
- Breyttu PORT í server/server.js í eitthvað annað (t.d., 8081)

**S: Gumma Lilla sýnir ekki ráð**
- Gakktu úr skugga um að checkbox sé hakað við í "Nýr Leikur" modal
- Endurnýjaðu síðuna og byrjaðu nýjan leik
- Athugaðu browser console fyrir villur

## Afkasta Athugasemdir

- Keyrir á 60fps hæfni með mjúkum WebSocket uppfærslum
- Lágmarks CPU/GPU notkun (CSS animations eingöngu, engin video encoding)
- ~100KB heildar gögn fyrir allar eignir
- Virkar á venjulegum Windows 11 fartölvu vélbúnaði

## Sérsníða

### Breyta Server Port
Breyttu `server/server.js`:
```javascript
const PORT = 8080; // Breyttu þessu
```

Uppfærðu síðan WebSocket URLs í:
- `overlay/overlay.js`
- `control/control.js`

### Breyta Overlay Litum
Breyttu `overlay/overlay.css` - leitaðu að litum gildum:
- `#26d07c` = Grænn (aðal litur)
- `#ffff00` = Gulur (áherslur)
- Aðlagaðu eftir þörfum

### Breyta Gumma Lilla Ráðum
Breyttu `control/checkoutAdvice.js` til að sérsníða checkout tillögur fyrir hvert stig (2-170).

### Aðlaga Overlay Stærð
OBS browser source stillingar - breyttu Width/Height

## Testar

Verkefnið inniheldur ítarlega test suite með 128+ testum:

```bash
# Keyra alla testa
npm test

# Keyra ákveðið test
npm test -- checkoutAdvice.test.js

# Keyra testa með coverage
npm test -- --coverage
```

**Test þekja:**
- ✅ **gameLogic.test.js** - Leikjareglur og rökfræði
- ✅ **messageHandlers.test.js** - Skilaboða handlers
- ✅ **websocketDispatcher.test.js** - Message routing
- ✅ **integration.test.js** - Heildstæðir leikja testar
- ✅ **checkoutAdvice.test.js** - Gumma Lilla (18 testar)
  - Öll gildi 2-170
  - Edge cases og bogey numbers
  - Data structure validation
- ✅ **ui.test.js** - UI aðgerðir
- ✅ **handlers.test.js** - Event handlers
- ✅ **rules.test.js** - Leikjareglur edge cases

## Leyfi

MIT License - Notaðu frjálslega fyrir persónuleg og viðskiptaverkefni

## Stuðningur

Fyrir vandamál eða spurningar:
1. Athugaðu Bilanaleit hlutann hér að ofan
2. Skoðaðu README og skjöl
3. Athugaðu browser console (F12) fyrir villur
4. Endurræstu serverinn og endurnýjaðu síður
5. Keyrðu testa: `npm test`

## Þróunar Saga

Þetta verkefni hefur gengið í gegnum margar endurbætur:
- **Phase 1**: Grunnatriði (stigatafla, leikjareglur)
- **Phase 2**: WebSocket samskipti og rauntíma uppfærslur
- **Phase 3**: Stjórnborðs UI og flýtilyklar
- **Phase 4**: Integration testar og kerfisuppfærsla
- **Phase 5**: Gumma Lilla checkout advice kerfi 🎯

---

**Njóttu þess að nota darts overlay-ið! 🎯**

*Gert með ❤️ fyrir darts aðdáendur*
