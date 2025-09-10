# Tilemap Configuration Guide

## Purpose
This guide documents how to configure `public/assets/tilemap/scenes/tilemap.json` for the Phaser-based platformer game. The tilemap system defines level layout, object placement, and gameplay mechanics.

## System Overview

### File Loading Flow
1. **Preloader** loads `tilemap.json` and parses tileset references
2. **Game Scene** creates tilemap layers and instantiates objects
3. **Sprites** read properties from both tilesets and object instances
4. **Properties cascade**: Tileset defaults → Object overrides

### Core Components
- **Tilemap**: JSON file defining the level structure
- **Layers**: Tile layers (terrain) and Object layers (entities)
- **Tilesets**: Asset definitions with default properties
- **Objects**: Game entities with specific behaviors
- **Properties**: Configuration parameters for customization

## JSON Structure

### Root Configuration
```json
{
  "width": 35,              // Map width in tiles
  "height": 19,             // Map height in tiles  
  "tilewidth": 64,          // Tile pixel width
  "tileheight": 64,         // Tile pixel height
  "orientation": "orthogonal",
  "renderorder": "right-down",
  "infinite": false,
  "layers": [...],          // Layer definitions
  "tilesets": [...],        // Asset definitions
  "version": 1.2,
  "tiledversion": "1.2.2"
}
```

## Layer Types

### 1. Tile Layer
Defines static terrain with collision detection.

```json
{
  "id": 3,
  "name": "Level1",         // Referenced in Game.ts
  "type": "tilelayer",
  "width": 35,
  "height": 19,
  "data": [0,0,2,1,1,...]   // Flat array of tile GIDs
}
```

**Tile GID Mapping:**
- `0` = Empty (no collision)
- `1` = terrain_grass_block_center (solid)
- `2` = terrain_grass_block_top (solid)

**Array Indexing:**
```javascript
index = y * width + x  // Convert coordinates to array index
```

### 2. Object Layer
Contains all interactive entities.

```json
{
  "id": 5,
  "name": "Objects",
  "type": "objectgroup",
  "objects": [...]          // Entity definitions
}
```

## Object Types and Properties

### Player (`type: "player"`)
**File:** `src/game/sprites/Player.ts`

```json
{
  "gid": 3,                 // References character_purple tileset
  "name": "character_purple",
  "type": "player",
  "x": 384,
  "y": 960,
  "width": 42,
  "height": 51,
  "properties": [
    {"name": "uuid", "type": "string", "value": "unique-id"},
    
    // Health
    {"name": "max_health", "type": "int", "value": 3},
    
    // Movement abilities
    {"name": "can_move", "type": "bool", "value": true},
    {"name": "can_jump", "type": "bool", "value": true},
    {"name": "can_double_jump", "type": "bool", "value": true},
    {"name": "can_wall_jump", "type": "bool", "value": true},
    {"name": "can_wall_slide", "type": "bool", "value": true},
    {"name": "can_charge_jump", "type": "bool", "value": true},
    {"name": "can_shoot", "type": "bool", "value": true},
    
    // Physics (optional)
    {"name": "move_speed", "type": "int", "value": 200},
    {"name": "jump_speed", "type": "int", "value": 500},
    {"name": "max_jumps", "type": "int", "value": 2}
  ]
}
```

**Code Implementation:**
- Parses properties in constructor
- `parseAbilityProperties()` configures movement abilities
- Physics body: 70% of texture size with 10% offset
- Collision bounds: Horizontal only (can fall off bottom)

### Enemy (`type: "enemy"`)
**File:** `src/game/sprites/Enemy.ts`

```json
{
  "gid": 8,                 // References frog tileset
  "name": "frog",
  "type": "enemy",
  "x": 960,
  "y": 1088,
  "properties": [
    {"name": "uuid", "type": "string", "value": "unique-id"}
  ]
}
```

**Tileset Properties (in frog tileset):**
```json
{
  "name": "move_method",
  "type": "string",
  "value": "move_and_jump"  // Movement AI
},
{
  "name": "damage",
  "type": "int", 
  "value": 1
},
{
  "name": "move_speed",
  "type": "int",
  "value": 100
},
{
  "name": "jump_power",
  "type": "int",
  "value": 400
},
{
  "name": "patrol_distance",
  "type": "int",
  "value": 200
},
{
  "name": "detection_range",
  "type": "int",
  "value": 300
},
{
  "name": "jump_interval",
  "type": "int",
  "value": 2000
},
{
  "name": "atlas",
  "type": "bool",
  "value": true              // Uses sprite atlas
},
{
  "name": "death_particle_color",
  "type": "string",
  "value": "#00ff00"
}
```

**Movement Methods:**
- `"static"`: No movement
- `"patrol"`: Walk back and forth
- `"jump"`: Jump in place
- `"move_and_jump"`: Frog-like hopping
- `"patrol_jump"`: Patrol with jumps
- `"follow"`: Chase player
- `"follow_jump"`: Chase with jumps

**Code Implementation:**
- `extractProperties()` reads from tileset then object
- Physics body: 80% of texture size
- Jump on defeat creates bounce effect

### Hazard (`type: "hazard"`)
**File:** `src/game/sprites/StaticHazard.ts`

```json
{
  "gid": 4,                 // References spikes tileset
  "name": "spikes",
  "type": "hazard",
  "x": 448,
  "y": 1088,
  "properties": [
    {"name": "uuid", "type": "string", "value": "unique-id"}
  ]
}
```

**Tileset Properties:**
```json
{
  "name": "damage",
  "type": "int",
  "value": 1
}
```

**Code Implementation:**
- Static physics body
- Damage read from properties (default: 1)
- Collision box: 48x48 with offset

### Collectible (`type: "collectible"`)
**File:** `src/game/sprites/Collectible.ts`

```json
{
  "gid": 6,                 // References coin_gold tileset
  "name": "coin_gold",
  "type": "collectible",
  "x": 896,
  "y": 640,
  "properties": [
    {"name": "uuid", "type": "string", "value": "unique-id"}
  ]
}
```

**Tileset Properties:**
```json
{
  "name": "score",
  "type": "int",
  "value": 100
},
{
  "name": "type",
  "type": "string", 
  "value": "coin"           // "coin", "key", "gem", etc.
},
{
  "name": "must_collect",
  "type": "bool",
  "value": false            // Required for level completion
},
{
  "name": "rotate",
  "type": "bool",
  "value": true             // Rotation animation
},
{
  "name": "particle_color",
  "type": "string",
  "value": "#FFD700"        // Particle effect color
}
```

**Code Implementation:**
- `extractProperties()` checks tileset then object
- Floating and pulsing animations
- Optional rotation if `rotate: true`
- Particle effects on collection

### Goal (`type: "goal"`)
**File:** `src/game/sprites/Goal.ts`

```json
{
  "gid": 5,                 // References flag tileset
  "name": "flag_green_a",
  "type": "goal",
  "x": 1792,
  "y": 64,
  "properties": [
    {"name": "uuid", "type": "string", "value": "unique-id"}
  ]
}
```

**Code Implementation:**
- Requires all `must_collect` items before activation
- Shows missing items visually if incomplete
- Triggers victory scene on collection

### Obstacle (`type: "obstacle"`)
**File:** `src/game/sprites/Obstacle.ts`

```json
{
  "gid": 9,                 // References block tileset
  "name": "block_empty",
  "type": "obstacle",
  "x": 704,
  "y": 896,
  "properties": [
    {"name": "uuid", "type": "string", "value": "unique-id"},
    {"name": "destructible", "type": "bool", "value": false},
    {"name": "health", "type": "int", "value": 3},
    {"name": "movable", "type": "bool", "value": false}
  ]
}
```

**Obstacle Variants:**
1. **Static**: Default immovable block
2. **Destructible**: `destructible: true` with `health`
3. **Movable**: `movable: true` (pushable by player)
4. **Hybrid**: Combine properties

**Physics Configuration (Movable):**
- Gravity: 800
- Drag: 800 (horizontal)
- Mass: 3
- Max velocity X: 200
- Collision box: 56x56 (prevents overlap)

### Trigger (`type: "trigger"`)
**File:** `src/game/sprites/Trigger.ts`

```json
{
  "name": "spike_move_trigger",
  "type": "trigger",
  "visible": false,         // Always invisible
  "x": 384,
  "y": 708,
  "width": 128,
  "height": 64,
  "properties": [
    {"name": "uuid", "type": "string", "value": "trigger-id"},
    {"name": "event_type", "type": "string", "value": "move"},
    {"name": "target_uuid", "type": "string", "value": "target-id"},
    
    // Movement trigger properties
    {"name": "velocity_x", "type": "float", "value": 0},
    {"name": "velocity_y", "type": "float", "value": -2000},
    {"name": "duration", "type": "int", "value": 1500},
    {"name": "repeat", "type": "bool", "value": true},
    {"name": "delay", "type": "int", "value": 200},
    {"name": "return_to_origin", "type": "bool", "value": false}
  ]
}
```

**Scale Trigger Properties:**
```json
{
  "name": "event_type",
  "value": "scale"
},
{
  "name": "scale_x",
  "type": "float",
  "value": 5.0
},
{
  "name": "scale_y", 
  "type": "float",
  "value": 5.0
}
```

**Optional Visual Properties:**
```json
{
  "name": "texture",
  "value": "button_idle"
},
{
  "name": "active_texture",
  "value": "button_pressed"
},
{
  "name": "inactive_texture",
  "value": "button_idle"
},
{
  "name": "use_sprite",
  "value": true             // Animated vs static
},
{
  "name": "visual_scale",
  "value": 1.5
}
```

**Code Implementation:**
- Zone physics body (static)
- Checks target exists before activation
- Handles destroyed targets gracefully
- Static objects use position tweens
- Dynamic objects use velocity changes

## Tileset Configuration

### Basic Tileset
```json
{
  "firstgid": 1,            // Global ID start
  "image": "assets/tilemap/tiles/terrain_grass_block_center.png",
  "imageheight": 64,
  "imagewidth": 64,
  "name": "terrain_grass_block_center",
  "tilecount": 1,
  "tileheight": 64,
  "tilewidth": 64,
  "tiles": [
    {
      "id": 0,              // Local tile ID
      "properties": [
        {
          "name": "collides",
          "type": "bool",
          "value": true     // Enables collision
        }
      ]
    }
  ]
}
```

### Sprite Atlas Tileset
```json
{
  "firstgid": 3,
  "image": "assets/player/character_purple.png",
  "name": "character_purple",
  "tiles": [
    {
      "id": 0,
      "properties": [
        {
          "name": "atlas",
          "type": "bool",
          "value": true     // Indicates sprite atlas
        }
      ]
    }
  ]
}
```

**Required Atlas Files:**
- `character_purple.png`: Sprite sheet
- `character_purple.json`: Frame definitions
- `character_purple_animators.json`: Animation config

### Property Inheritance
1. **Tileset properties**: Default values
2. **Object properties**: Override tileset values

Example:
```javascript
// Tileset defines: damage = 1
// Object overrides: damage = 3
// Result: Object has damage = 3
```

## UUID System

### Requirements
- **Format**: Standard UUID v4 (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
- **Uniqueness**: Must be globally unique in tilemap
- **Usage**: Object references, trigger targeting

### Example Usage
```json
// Trigger references object
{
  "type": "trigger",
  "properties": [
    {"name": "uuid", "value": "trigger-001"},
    {"name": "target_uuid", "value": "platform-001"}
  ]
}

// Target object
{
  "type": "obstacle",
  "properties": [
    {"name": "uuid", "value": "platform-001"}
  ]
}
```

## Coordinate System

### Positioning
- **Origin**: Top-left (0, 0)
- **Units**: Pixels for objects
- **Y-Offset**: Objects positioned at `y - 32` in code

### Important Notes
- Object Y position in tilemap is adjusted by -32 pixels in sprites
- This accounts for anchor point differences
- Always test visual alignment in game

## Property Types

### Supported Types
- `string`: Text, UUIDs, colors (#RRGGBB)
- `int`: Whole numbers
- `float`: Decimals
- `bool`: true/false

### Color Format
```json
{
  "name": "particle_color",
  "type": "string",
  "value": "#FFD700"        // Hex color string
}
```

## Creating Game Mechanics

### Moving Platform
```json
// Platform (static for trigger control)
{
  "type": "obstacle",
  "name": "moving_platform",
  "x": 512,
  "y": 400,
  "properties": [
    {"name": "uuid", "value": "platform-001"},
    {"name": "movable", "value": false}
  ]
}

// Movement trigger
{
  "type": "trigger",
  "visible": false,
  "x": 450,
  "y": 350,
  "width": 200,
  "height": 100,
  "properties": [
    {"name": "uuid", "value": "trigger-001"},
    {"name": "event_type", "value": "move"},
    {"name": "target_uuid", "value": "platform-001"},
    {"name": "velocity_x", "value": 100},
    {"name": "velocity_y", "value": 0},
    {"name": "duration", "value": 3000},
    {"name": "repeat", "value": true},
    {"name": "return_to_origin", "value": true}
  ]
}
```

### Key-Door System
```json
// Key (in tileset properties)
{
  "name": "must_collect",
  "value": true
},
{
  "name": "type",
  "value": "key"
}

// Goal automatically requires all must_collect items
```

### Boss Enemy
```json
// Enemy
{
  "type": "enemy",
  "name": "frog",
  "x": 800,
  "y": 600,
  "properties": [
    {"name": "uuid", "value": "boss-001"}
  ]
}

// Growth trigger
{
  "type": "trigger",
  "visible": false,
  "x": 700,
  "y": 500,
  "width": 300,
  "height": 200,
  "properties": [
    {"name": "uuid", "value": "grow-trigger"},
    {"name": "event_type", "value": "scale"},
    {"name": "target_uuid", "value": "boss-001"},
    {"name": "scale_x", "value": 3.0},
    {"name": "scale_y", "value": 3.0},
    {"name": "duration", "value": 2000},
    {"name": "return_to_origin", "value": true}
  ]
}
```

## Validation Checklist

### Before Testing
- [ ] Valid JSON syntax
- [ ] All UUIDs are unique
- [ ] GIDs match defined tilesets
- [ ] Trigger target_uuids exist
- [ ] Object positions within bounds
- [ ] Layer data array length = width × height
- [ ] Image paths are correct
- [ ] Color values in #RRGGBB format

### Common Issues

#### Objects Not Appearing
- Check GID matches tileset firstgid
- Verify image path in tileset
- Ensure visible: true
- Check coordinates

#### Collisions Not Working  
- Tile needs `collides: true` property
- Check physics body setup in code
- Verify layer ordering

#### Triggers Not Activating
- Target UUID must exist
- Target must be active (not destroyed)
- Trigger bounds must overlap player path
- Event type must be "move" or "scale"

#### Properties Not Applied
- Check tileset properties first
- Object properties override tileset
- Property names are case-sensitive
- Arrays use index-based access

## Performance Guidelines

### Recommended Limits
- **Enemies**: < 10 per screen
- **Collectibles**: < 30 visible
- **Triggers**: Avoid overlapping
- **Obstacles**: Use static where possible

### Optimization Tips
- Group similar objects together
- Reuse tilesets (don't duplicate)
- Minimize trigger overlap
- Use appropriate physics bodies

## Debugging

### Enable Debug Visuals
In `src/game/sprites/Trigger.ts`:
```javascript
// Uncomment lines 47-49 to see trigger zones
if (import.meta.env.DEV && !this.sprite) {
    this.createDebugVisualization();
}
```

### Console Logging
Objects log creation details:
```
[Obstacle] Created at (704, 896), destructible: false, movable: false
```

### JSON Validation
```bash
# Validate syntax
jq . public/assets/tilemap/scenes/tilemap.json

# Pretty print
python -m json.tool public/assets/tilemap/scenes/tilemap.json
```

## Advanced Features

### Chain Reactions
Use delays to create sequences:
```json
// First trigger
{"name": "delay", "value": 0}

// Second trigger  
{"name": "delay", "value": 500}

// Third trigger
{"name": "delay", "value": 1000}
```

### Difficulty Scaling
Adjust enemy properties:
```json
// Easy
{"name": "damage", "value": 1}
{"name": "move_speed", "value": 50}

// Hard
{"name": "damage", "value": 3}
{"name": "move_speed", "value": 150}
```

### Hidden Areas
Place platforms requiring specific abilities:
- Double jump: Higher platforms
- Wall jump: Vertical shafts
- Charge jump: Maximum distance gaps

## File References

### Source Files
- `src/game/scenes/Game.ts`: Object creation
- `src/game/scenes/Preloader.ts`: Asset loading
- `src/game/sprites/*.ts`: Object implementations

### Asset Files
- `public/assets/tilemap/scenes/tilemap.json`: Level data
- `public/assets/*/`: Graphics and audio
- `public/assets/*/*.json`: Atlas definitions

## Summary

This tilemap configuration system provides:
1. **Flexible object placement** with UUID-based references
2. **Property inheritance** from tilesets to objects
3. **Seven object types** with specific behaviors
4. **Trigger system** for dynamic interactions
5. **Sprite atlas support** for animations

Key principles:
- Properties cascade from tileset to object
- UUIDs enable object relationships
- Triggers create dynamic gameplay
- Physics bodies determine interactions
- Visual feedback enhances player experience

Always validate JSON syntax and test thoroughly in-game to ensure proper behavior.