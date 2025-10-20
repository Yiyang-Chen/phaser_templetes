# Tilemap Configuration Guide

## Purpose
This guide documents how to configure `public/assets/tilemap/scenes/tilemap.json` for the Phaser-based platformer game. The tilemap system defines level layout, object placement, and gameplay mechanics.

## System Overview

### 🆕 Resource Loading Flow (v3.0)
1. **Boot Scene (preload)** - 处理URL参数，加载`game_config.json`并初始化GlobalResourceManager
2. **Boot Scene (create)** - 所有配置加载完成，启动Preloader场景
3. **Preloader** - 使用`LevelSceneConfigLoader`根据关卡编号加载场景资源
4. **LevelSceneConfigLoader** - 优先加载远程资源，自动映射tilemap key为统一的`'tilemap'`
5. **CustomTileMapLoader** - 自动使用资源键加载tileset资源
6. **Game Scene** - 创建tilemap图层并实例化游戏对象
7. **Sprites** - 从tileset和对象实例读取属性
8. **Properties cascade** - Tileset默认值 → 对象覆盖值

### Core Components
- **game_config.json**: Central resource configuration defining asset paths
- **GlobalResourceManager**: Resolves resource keys to local/remote paths (优先远程资源)
- **LevelSceneConfigLoader**: 关卡场景配置加载器，根据关卡编号加载对应资源
- **API下载系统**: 统一的远程资源下载接口 `https://game-api.dev.knoffice.tech/game/api/public/assets/download`
- **Tilemap**: JSON file defining level structure using resource keys
- **Layers**: Tile layers (terrain) and Object layers (entities)
- **Tilesets**: Asset definitions using resource keys, use `name` as key
- **Objects**: Game entities with specific behaviors, using `name` key to reference to a specific `tilesets`
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
You must make sure that layer array length do not exceeds width * height.

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

- `0` = Empty (no collision)

**Array Indexing:**
```javascript
index = y * width + x  // Convert coordinates to array index
```
- length of data array should euqals to width * height

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

## Example Object Types and Properties in Template

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

### 🆕 Resource Key System (v2.0)

Tilesets now use resource keys instead of hardcoded file paths. The actual paths are resolved through `game_config.json`.

#### 1. Configure Resource in game_config.json
```json
{
  "assets": [
    {
      "type": "ground_asset_package",
      "id": 1,
      "name": "terrain_grass",
      "resources": [
        {
          "remote": {
            "key": "terrain_grass_block_center",
            "resource_type": "image",
            "url": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_type=ground_asset_package&asset_id=1&key=terrain_grass_block_center.png"
          }
        }
      ]
    }
  ]
}
```

#### 2. Reference in Tilemap using Resource Key
```json
{
  "firstgid": 1,            // Global ID start
  "image": "terrain_grass_block_center",  // 🆕 Resource key (NOT URL!)
  "imageheight": 64,
  "imagewidth": 64,
  "name": "terrain_grass_block_center",   // ⚠️ MUST match image field exactly
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

### ⚠️ Migration from Hardcoded Paths

**Old Way (Deprecated):**
```json
{
  "image": "assets/tilemap/tiles/terrain_grass_block_center.png"  // ❌ Hardcoded path
}
```

**New Way (Recommended):**
```json
{
  "image": "terrain_grass_block_center"  // ✅ Resource key
}
```

### Sprite Atlas Tileset

#### 1. Configure Sprite Resources in game_config.json
```json
{
  "assets": [
    {
      "type": "sprite",
      "id": 3,
      "name": "character_purple",
      "resources": [
        {
          "remote": {
            "key": "character_purple_image",
            "resource_type": "image",
            "url": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_type=sprite&asset_id=3&key=image"
          }
        },
        {
          "remote": {
            "key": "character_purple_json",
            "resource_type": "json",
            "url": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_type=sprite&asset_id=3&key=atlas_json"
          }
        },
        {
          "remote": {
            "key": "character_purple_animators",
            "resource_type": "json",
            "url": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_type=sprite&asset_id=3&key=animation_json"
          }
        }
      ]
    }
  ]
}
```

#### 2. Reference in Tilemap using Resource Key
```json
{
  "firstgid": 3,
  "image": "character_purple_image",  // 🆕 Use image resource key
  "name": "character_purple_image",   // ⚠️ MUST match image field exactly
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

**Required Atlas Files (Auto-loaded by CustomTileMapLoader):**
- `character_purple_image`: Sprite sheet (PNG)
- `character_purple_json`: Frame definitions (JSON)
- `character_purple_animators`: Animation config (JSON)

#### ⚠️ Critical: Sprite Atlas Configuration

**Problem:** When AI generates tilemaps, character resources are often treated as regular images instead of sprite atlases, causing the entire sprite sheet to display instead of individual animation frames.

**Common AI Generation Error:** Large language models sometimes incorrectly place the `atlas` property at the tileset level instead of in the `tiles[0].properties` array.

**❌ Incorrect AI-Generated Format:**
```json
{
  "firstgid": 3,
  "image": "character_purple_image",
  "name": "character_purple",
  "tilecount": 1,
  "tileheight": 102,
  "tilewidth": 84,
  "properties": [                    // ❌ WRONG: properties at tileset level
    {
      "name": "atlas",
      "type": "bool",
      "value": true
    },
    {
      "name": "collides",             // ❌ WRONG: collides also at wrong level
      "type": "bool",
      "value": true
    }
  ]
}
```

**✅ Correct Configuration:**
```json
{
  "firstgid": 3,
  "image": "character_purple_image",  // 🆕 Use resource key
  "name": "character_purple",
  "tiles": [                         // ✅ CORRECT: properties in tiles array
    {
      "id": 0,
      "properties": [
        {
          "name": "atlas",
          "type": "bool",
          "value": true     // ESSENTIAL for sprite atlases
        },
        {
          "name": "collides",           // ✅ CORRECT: collides at right level
          "type": "bool",
          "value": true
        }
      ]
    }
  ]
}
```

**Solution:** The system now supports both formats for compatibility:
1. **Standard format**: Properties in `tiles[0].properties` (recommended)
2. **Compatibility mode**: Properties in tileset `properties` (auto-detected and handled)

**Supported Properties with Auto-Fix:**
- `atlas`: Sprite atlas detection
- `collides`: Collision detection for terrain tiles
- More properties can be easily added to the system

**What happens without `atlas: true`:**
- ❌ Displays entire sprite sheet as one image
- ❌ No animation frames work
- ❌ Character appears as large, distorted image
- ❌ Game physics may break due to incorrect dimensions

**What happens with `atlas: true`:**
- ✅ Loads sprite sheet correctly
- ✅ Uses .json file to define individual frames
- ✅ Animations work properly
- ✅ Correct character dimensions and physics

**Assets that MUST have `atlas: true`:**
- All character sprites (player, enemies)
- Any animated objects using sprite sheets
- Multi-frame assets with accompanying .json files

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
- [ ] **Tilesets use resource keys, not URLs or file paths** ⚠️ **CRITICAL**
- [ ] **All resource keys exist in game_config.json** ⚠️ **CRITICAL**
- [ ] Color values in #RRGGBB format
- [ ] **Property names match code expectations exactly** ⚠️ **CRITICAL**
  - [ ] Check [PROPERTY_NAMING_STANDARDS.md](./PROPERTY_NAMING_STANDARDS.md) for all standard names
- [ ] **Tileset `name` and `image` fields follow correct rules** ⚠️ **CRITICAL**
  - [ ] Static images: `name` and `image` identical
  - [ ] Atlas images: `image` has `_image` suffix, `name` without suffix
- [ ] **Character tilesets have `atlas: true` property**
- [ ] **Sprite atlas .json files exist for all atlas tilesets**
- [ ] **Animation files (_animators.json) exist for animated sprites**

### Common Issues

#### Resource Key vs URL Path Error (Critical AI Error)
- **症状**: `[GlobalResourceManager] 未找到资源key: https://game-api.dev.knoffice.tech/...` 错误
- **原因**: AI生成的tilemap.json中tilesets.image字段使用了完整URL而不是资源键
- **常见错误**: 
  - 直接使用API下载URL作为image值
  - 使用本地文件路径而不是资源键
  - 资源键与game_config.json中定义的不匹配
- **解决方案**:
  - 检查tilemap.json中所有tilesets的image字段
  - 确保使用game_config.json中定义的资源键
  - 验证资源键名称完全匹配
- **预防措施**: AI生成tilemap前必须先检查game_config.json中的可用资源键

#### Property Name Inconsistency (Critical AI Error)
- **症状**: 游戏对象行为异常，属性不生效，使用默认值
- **原因**: AI使用了错误的属性名，与代码期望不匹配
- **常见错误**:
  - 使用 `move_mode` 而不是 `move_method`
  - 使用 `health` 而不是 `damage`（对于敌人）
  - 使用驼峰命名 `moveSpeed` 而不是 `move_speed`
  - 使用 `patrol_range` 而不是 `patrol_distance`
- **解决方案**: 
  - 严格参考 [PROPERTY_NAMING_STANDARDS.md](./PROPERTY_NAMING_STANDARDS.md)
  - 使用snake_case命名约定
  - 验证所有属性名与代码实现匹配
- **预防措施**: AI生成配置前必须检查标准属性名文档

#### Tileset Name/Image Mismatch (Critical Error for Static Images)
- **症状**: 纹理加载失败，地形显示为空白或默认纹理
- **原因**: 对于静态图像，`name` 和 `image` 字段不一致
- **解决方案**: 
  - **静态图像**: `name` 和 `image` 字段必须完全相同
  - **Atlas 图集**: `image` 使用 `_image` 后缀，`name` 不使用后缀
- **示例**:
  ```json
  // ❌ 错误 - 静态图像 name 和 image 不一致
  {
    "image": "terrain_purple_cloud",
    "name": "terrain_purple"
  }
  
  // ✅ 正确 - 静态图像 name 和 image 一致
  {
    "image": "terrain_purple_cloud", 
    "name": "terrain_purple_cloud"
  }
  
  // ✅ 正确 - Atlas 图集的特殊规则
  {
    "image": "character_purple_image",  // 带 _image 后缀
    "name": "character_purple",         // 不带后缀
    "tiles": [
      {
        "id": 0,
        "properties": [
          {"name": "atlas", "type": "bool", "value": true}
        ]
      }
    ]
  }
  
  // ✅ 正确 - 另一个 Atlas 图集示例
  {
    "image": "frog_image",              // 带 _image 后缀
    "name": "frog",                     // 不带后缀
    "tiles": [
      {
        "id": 0,
        "properties": [
          {"name": "atlas", "type": "bool", "value": true}
        ]
      }
    ]
  }
  ```

#### Objects Not Appearing
- Check GID matches tileset firstgid
- Verify image path in tileset
- Ensure visible: true
- Check coordinates

#### Characters Display as Full Sprite Sheet (Most Common AI Error)
- **Symptom**: Character appears as large, distorted image showing all animation frames
- **Cause**: Missing `atlas: true` property in tileset
- **Solution**: Add `atlas: true` to tileset properties
- **Prevention**: Always check character tilesets have atlas property when using sprite sheets

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

#### Animation Not Playing
- Verify `atlas: true` is set in tileset
- Check .json and _animators.json files exist
- Ensure frame names match between files
- Verify animation is triggered in code

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

## File References

### Source Files
- `src/game/scenes/Game.ts`: Object creation
- `src/game/scenes/Preloader.ts`: Asset loading
- `src/game/sprites/*.ts`: Object implementations

### Asset Files
- `public/assets/game_config.json`: 🆕 Central resource configuration
- `public/assets/tilemap/scenes/tilemap.json`: Level data (uses resource keys)
- `public/assets/*/`: Graphics and audio (referenced by keys)
- `public/assets/*/*.json`: Atlas definitions (referenced by keys)

## 🆕 Resource Management Integration (v2.0)

### Unified Asset Loading

The tilemap system now integrates with the unified resource management system:

#### Configuration Flow
1. **Define resources** in `game_config.json` with local/remote paths
2. **Reference by key** in `tilemap.json` instead of hardcoded paths
3. **Auto-resolution** by CustomTileMapLoader during loading
4. **Flexible deployment** - switch between local/remote without changing tilemap

#### Example Complete Configuration

**game_config.json:**
```json
{
  "assets": [
    {
      "type": "ground_asset_package",
      "id": 1,
      "name": "terrain_grass",
      "resources": [
        {
          "remote": {
            "key": "terrain_grass_block_center",
            "resource_type": "image",
            "url": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_type=ground_asset_package&asset_id=1&key=terrain_grass_block_center.png"
          }
        },
        {
          "remote": {
            "key": "terrain_grass_block_top",
            "resource_type": "image",
            "url": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_type=ground_asset_package&asset_id=1&key=terrain_grass_block_top.png"
          }
        }
      ]
    },
    {
      "type": "sprite",
      "id": 3,
      "name": "character_purple",
      "resources": [
        {
          "remote": {
            "key": "character_purple_image",
            "resource_type": "image",
            "url": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_type=sprite&asset_id=3&key=image"
          }
        },
        {
          "remote": {
            "key": "character_purple_json",
            "resource_type": "json",
            "url": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_type=sprite&asset_id=3&key=atlas_json"
          }
        },
        {
          "remote": {
            "key": "character_purple_animators",
            "resource_type": "json",
            "url": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_type=sprite&asset_id=3&key=animation_json"
          }
        }
      ]
    }
  ]
}
```

**tilemap.json (using resource keys):**
```json
{
  "tilesets": [
    {
      "firstgid": 1,
      "image": "terrain_grass_block_center",  // Resource key
      "name": "terrain_grass_block_center"
    },
    {
      "firstgid": 2,
      "image": "terrain_grass_block_top",     // Resource key
      "name": "terrain_grass_block_top"
    },
    {
      "firstgid": 3,
      "image": "character_purple_image",     // Resource key
      "name": "character_purple",
      "tiles": [
        {
          "id": 0,
          "properties": [
            {
              "name": "atlas",
              "type": "bool",
              "value": true
            }
          ]
        }
      ]
    }
  ]
}
```

### Benefits of Resource Key System

- ✅ **Flexible Deployment**: Switch between local/CDN without changing tilemap
- ✅ **Version Control**: Easy asset versioning through URL changes
- ✅ **Performance**: Optimized loading with proper caching headers
- ✅ **Scalability**: Support for multiple environments (dev/staging/prod)
- ✅ **Maintainability**: Centralized asset path management

### Migration Guide

**Step 1:** Add resources to `game_config.json`
**Step 2:** Replace hardcoded paths with resource keys in `tilemap.json`
**Step 3:** Test loading in both development and production environments

For detailed information, see [RESOURCE_MANAGEMENT_GUIDE.md](./RESOURCE_MANAGEMENT_GUIDE.md).

## Summary

This tilemap configuration system provides:
1. **Flexible object placement** with UUID-based references
2. **Property inheritance** from tilesets to objects
3. **Seven object types** with specific behaviors
4. **Trigger system** for dynamic interactions
5. **Sprite atlas support** for animations
6. **🆕 Unified resource management** with local/remote asset support

Key principles:
- Properties cascade from tileset to object
- UUIDs enable object relationships
- Triggers create dynamic gameplay
- Physics bodies determine interactions
- Visual feedback enhances player experience

Always validate JSON syntax and test thoroughly in-game to ensure proper behavior.