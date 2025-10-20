# How to Build

## 🚨 Critical Rules for AI Agents

**DO NOT modify these files unless specified when creating new games from template**:
- ❌ `package.json` - contains required dependencies (vite, phaser, typescript)
- ❌ `index.html` - error handling and structure are pre-configured
- ❌ `vite/*.mjs` - build configurations are optimized

**Verification after `npm install`**:
- ✅ Should install **70+ packages** (correct: phaser + vite + all dependencies)
- ❌ If only ~10-20 packages → package.json was modified/corrupted

**Build verification**:
- ✅ Never filter output with `| head` or `| grep` - you'll miss the result
- ✅ Exit code 0 + "Done" message = success
- ✅ npm warnings (funding, vulnerabilities) are normal, NOT errors

## Prerequisites
- Node.js 16.0.0 or higher
- npm 7.0.0 or higher

## Quick Start

### 1. Install Dependencies
```bash
npm install --include=dev
```
Do not use npm install --force unless necessary, if you use --force, ignore `npm warn using --force Recommended protections disabled.`. It is not an error. Try build the project directly.

### 2. Development Mode
```bash
# Start development server with hot reload
npm run dev

# Opens at http://localhost:8080
```

### 3. Production Build
```bash
# Build for production
npm run build

# Output files will be in the 'dist' folder
```

## Build Output
After running `npm run build`, the `dist` folder contains:
```
dist/
├── assets/          # JavaScript and CSS files
├── index.html       # Main HTML file
└── favicon.png      # Favicon
```

## Deployment
The `dist` folder contains all files needed for deployment. Simply upload its contents to any static web hosting service (GitHub Pages, Netlify, Vercel, etc.).

## Additional Commands
```bash
# Build without console logs
npm run build-nolog

# Development without custom logging
npm run dev-nolog
```

## Troubleshooting

### Out of Memory Error
If build fails with memory error:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Port Already in Use
If port 8080 is busy:
```bash
npm run dev -- --port 3000
```

That's it! Run `npm run build` and your game is ready for deployment.