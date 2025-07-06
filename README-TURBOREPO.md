# Turborepo Setup for Computer Vision MLOps

## 🚀 Quick Start

This project now uses Turborepo to manage and run multiple services in parallel.

### Available Commands

```bash
# Run both AsphaltTracker and Frontend in parallel
npm run dev:apps

# Run all workspaces (if you add more)
npm run dev

# Build all services
npm run build

# Run tests across all services
npm run test

# Lint all services
npm run lint
```

### Services

1. **AsphaltTracker** (Port 5000)
   - Full-stack application with Express server and React client
   - WebSocket support for real-time updates
   - Database integration with Drizzle ORM

2. **Frontend** (Port 3000)
   - React application
   - Material-UI components
   - Proxies API calls to port 8000

### Architecture

```
computer-vision-mlops/
├── AsphaltTracker/          # Full-stack app (port 5000)
├── frontend/                # React app (port 3000)
├── turbo.json              # Turborepo configuration
└── package.json            # Root workspace configuration
```

### Development Workflow

1. **Start both services:**
   ```bash
   npm run dev:apps
   ```

2. **Access the applications:**
   - AsphaltTracker: http://localhost:5000
   - Frontend: http://localhost:3000

3. **Monitor logs:**
   - Turborepo shows logs from both services with prefixes
   - Each service runs in its own context

### Troubleshooting

- **Environment Variables**: Fixed with cross-env for Windows compatibility
- **Socket Binding**: Removed Windows-incompatible reusePort option
- **Dependencies**: Run `npm install` in individual service directories if needed

### Benefits of Turborepo

- ✅ **Parallel Execution**: Both services start simultaneously
- ✅ **Shared Dependencies**: Efficient dependency management
- ✅ **Task Caching**: Faster builds and tests
- ✅ **Incremental Builds**: Only rebuild what changed
- ✅ **Unified Commands**: Single commands to control all services