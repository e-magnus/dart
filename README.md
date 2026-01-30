# Darts Overlay Kerfi 🎯

PWA offline darts scoreboard + OBS broadcast overlay system með real-time WebSocket sync.

## ✨ Eiginleikar

- 🎯 **Real-time sync** - WebSocket samstilling milli allra tækja
- 📱 **PWA** - Installable, offline-ready, service worker
- 🎨 **OBS-ready** - 1920x1080 transparent overlay
- 📊 **Checkout suggestions** - "Gumma Lilla" fyrir 2-170
- ⌨️ **Keyboard shortcuts** - Fljótur innsláttur
- 🏆 **2-4 players** - 501/301 formats
- 🔄 **Bull-up** - Automatic player order
- ✅ **100% offline** - Engar ytri tengingar

## 🚀 Fljótleg byrjun

### Requirements

- Node.js 18+
- npm 8+

### Installation

```bash
# Clone repo
git clone https://github.com/e-magnus/dart.git
cd dart

# Install dependencies
npm install

# Start development server
npm run dev
```

Server keyrir á: `http://localhost:8080`

### Usage

**Control Panel** (PWA):

```
http://localhost:8080/control/control.html?room=ROOM123
```

**Overlay** (OBS Browser Source):

```
http://localhost:8080/overlay/overlay.html?room=ROOM123
```

Room ID þarf að vera það sama á báðum!

## 📦 Umhverfisbreytur

Engar umhverfisbreytur nauðsynlegar fyrir local development.

**Production:**

- `PORT` - Server port (default: 8080)
- WebSocket automatically uses same port as HTTP

Sjá [.env.example](.env.example) fyrir dæmi.

## 📚 Skjölun

- **[Architecture](docs/architecture.md)** - System design og data flow
- **[PWA Implementation](docs/pwa.md)** - Service Worker, offline, caching
- **[Runbook](docs/runbook.md)** - Troubleshooting og common issues
- **[Contributing](CONTRIBUTING.md)** - Definition of Done og development guide
- **[Quality Standards](QUALITY.md)** - CI/CD, linting, testing

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

**Test coverage:**

- Unit tests: `gameLogic.js`, `messageHandlers.js`
- Integration tests: WebSocket message flow
- E2E tests: Coming soon (Playwright)

## 🔧 Development

### NPM Scripts

```bash
npm start              # Start production server
npm run dev            # Start development server
npm test               # Run tests
npm run quality        # Run all quality checks (format, lint, test)
npm run lint           # Lint code
npm run lint:fix       # Fix lint issues
npm run format         # Format code with Prettier
npm run format:check   # Check formatting
```

### Workflow

1. **Make changes** to code
2. **Run quality checks** before commit:
   ```bash
   npm run quality
   ```
3. **Commit** - Pre-commit hook runs lint-staged automatically
4. **Push** - CI runs automatically on GitHub

### Project Structure

```
darts-overlay/
├── control/              # PWA Control Panel
│   ├── control.html      # UI
│   ├── handlers.js       # Event handlers
│   ├── sw.js             # Service Worker
│   └── manifest.webmanifest
├── overlay/              # OBS Display
│   ├── overlay.html
│   └── overlay.js
└── server/               # WebSocket Server
    ├── server.js         # HTTP + WS server
    ├── gameLogic.js      # Pure game rules
    ├── messageHandlers.js # Action/reducers
    └── websocketDispatcher.js

docs/                     # Documentation
├── architecture.md
├── pwa.md
└── runbook.md

.github/workflows/        # CI/CD
└── ci.yml                # GitHub Actions pipeline
```

## 🏗️ Architecture

**Client-Server Architecture:**

```
Control Panel (PWA) ←→ WebSocket Server ←→ Overlay (OBS)
                              ↓
                         Game Logic
```

- **Server** er single source of truth
- **Clients** eru read-only views
- **WebSocket** real-time broadcast
- **Rooms** fyrir multi-game isolation

Sjá [docs/architecture.md](docs/architecture.md) fyrir details.

## 🔐 Öryggi

- **Engin persónugreinanleg gögn** - Bara leikmannanöfn (notandi velur)
- **Engar ytri API köll** - 100% offline
- **WebSocket** - Óencrypted í development, WSS í production
- **No authentication** - Room ID er eina "security"

Sjá [SECURITY.md](SECURITY.md) fyrir security policy.

## 📊 CI/CD

**GitHub Actions** keyrir sjálfkrafa á öllum PRs:

1. ✨ **Format Check** (Prettier)
2. 🔍 **Lint** (ESLint) - Fail fast
3. 🧪 **Tests** (Jest)
4. 🏗️ **Build Check**

Sjá [.github/workflows/ci.yml](.github/workflows/ci.yml)

## 🚢 Deployment

**Render.com** (recommended):

1. Push til GitHub
2. Connect Render.com til repo
3. Auto-deploy on push

**Configuration:**

- Build: `npm install`
- Start: `npm start`
- Port: Auto (from env)

Sjá [render.yaml](render.yaml) fyrir config.

**Manual:**

```bash
npm install
npm start
# Server runs on port 8080
```

## 🤝 Contributing

Vinsamlegast lestu [CONTRIBUTING.md](CONTRIBUTING.md) fyrir:

- Definition of Done
- Code quality standards
- PR workflow
- Testing requirements

**Stutt útgáfa:**

```bash
# Áður en þú committir
npm run quality

# Pre-commit hook keyrir sjálfkrafa
git commit -m "feat: add feature"
```

## 📄 License

MIT

## 🙏 Acknowledgments

- **"Gumma Lilla"** checkout suggestions
- Icelandic darts community
- Built with ❤️ for dartara

## 🐛 Bug Reports

Sjá [docs/runbook.md](docs/runbook.md) fyrir troubleshooting.

Report bugs með:

1. Lýsingu á vandamáli
2. Steps to reproduce
3. Expected vs actual behavior
4. Browser/device info
5. Console errors

## 📮 Contact

Repository: https://github.com/e-magnus/dart

---

**Stutt leiðbeiningar:**

1. `npm install && npm run dev`
2. Open `http://localhost:8080/control/control.html?room=TEST`
3. Open `http://localhost:8080/overlay/overlay.html?room=TEST` (í OBS)
4. Byrjaðu að spila! 🎯
