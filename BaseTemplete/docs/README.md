# Base Template Documentation

## Overview
This is a minimal Phaser.js template for starting new game projects. It provides a clean foundation with TypeScript support and Vite build system.

## Features
- **Phaser.js 3.x**: Latest version of the Phaser game framework
- **TypeScript**: Full TypeScript support with type definitions
- **Vite**: Fast build tool and development server
- **Scene Management**: Basic scene structure (Boot, Preloader, Game, etc.)
- **Asset Loading**: Organized asset management system

## Project Structure
```
src/
├── game/
│   ├── main.ts          # Game configuration
│   └── scenes/          # Game scenes
│       ├── Boot.ts      # Initialization scene
│       ├── Preloader.ts # Asset loading scene
│       ├── Game.ts      # Main game scene
│       ├── MainMenu.ts  # Menu scene
│       └── GameOver.ts  # Game over scene
├── main.ts              # Application entry point
└── vite-env.d.ts        # Vite type definitions
```

## Getting Started
1. Install dependencies: `npm install`
2. Start development: `npm run dev`
3. Build for production: `npm run build`

## Development
- Modify scenes in `src/game/scenes/`
- Add assets to `public/assets/`
- Configure game settings in `src/game/main.ts`

## Customization
- Add new scenes by extending the Scene class
- Modify the game configuration in `src/game/main.ts`
- Update the build configuration in `vite/` directory
