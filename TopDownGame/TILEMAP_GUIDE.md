# Tilemap Configuration Guide

This guide explains how to configure game objects in Tiled tilemap editor for the Phaser game.

## Table of Contents
- [Collectible Items](#collectible-items)
- [Enemies](#enemies)
- [Player](#player)
- [Hazards](#hazards)
- [Goals](#goals)

## Collectible Items

Collectibles are items that players can collect during gameplay. They support extensive customization through tilemap properties.

### Object Type
Set the object type to `collectible` in Tiled.

### Configurable Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `score` | int | 0 | Points awarded when collected |
| `must_collect` | bool | false | Whether this item is required for level completion |
| `type` | string | "misc" | Category for grouping items (used in victory screen) |
| `rotate` | bool | false | Whether the item should rotate continuously |
| `particle_color` | string | "#FFFFFF" | Hex color for particle effects when collected |

### Examples

#### Gold Coin
```json
{
  "type": "collectible",
  "name": "coin_gold",
  "properties": [
    { "name": "score", "type": "int", "value": 100 },
    { "name": "type", "type": "string", "value": "coin" },
    { "name": "rotate", "type": "bool", "value": true },
    { "name": "particle_color", "type": "string", "value": "#FFD700" }
  ]
}
```

#### Green Key (Required Item)
```json
{
  "type": "collectible",
  "name": "hud_key_green",
  "properties": [
    { "name": "must_collect", "type": "bool", "value": true },
    { "name": "type", "type": "string", "value": "key" },
    { "name": "rotate", "type": "bool", "value": false },
    { "name": "particle_color", "type": "string", "value": "#00FF00" }
  ]
}
```

#### Custom Gem
```json
{
  "type": "collectible",
  "name": "gem_purple",
  "properties": [
    { "name": "score", "type": "int", "value": 500 },
    { "name": "type", "type": "string", "value": "gem" },
    { "name": "rotate", "type": "bool", "value": true },
    { "name": "particle_color", "type": "string", "value": "#9400D3" }
  ]
}
```

### Type Categories

You can use any string for the `type` property. Items are automatically grouped by type in the victory screen. Common types include:

- `coin` - Currency items
- `key` - Keys or access items
- `gem` - Valuable collectibles
- `star` - Achievement items
- `powerup` - Power-up items
- `health` - Health items
- Any custom type you want!

### Visual Effects

All visual effects are controlled through properties:

1. **Floating Animation**: All collectibles have a gentle floating animation (automatic)
2. **Rotation**: Set `rotate: true` for continuous rotation
3. **Particle Color**: Use `particle_color` to customize the collection effect
4. **Pulsing**: All collectibles have a subtle pulsing effect (automatic)

### Must-Collect Items

Items with `must_collect: true` create a level completion requirement:
- Players cannot complete the level without collecting all must-collect items
- When reaching the goal without required items, a visual warning shows the missing items
- The victory screen displays all collected must-collect items

## Enemies

Enemies are hostile entities with various movement patterns and behaviors.

### Object Type
Set the object type to `enemy` in Tiled.

### Configurable Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `damage` | int | 1 | Damage dealt to player on contact |
| `move_method` | string | "static" | Movement pattern (see below) |
| `move_speed` | int | 100 | Movement speed in pixels per second |
| `jump_power` | int | 400 | Jump strength for jumping enemies |
| `patrol_distance` | int | 200 | Distance to patrol back and forth |
| `detection_range` | int | 300 | Range to detect player (for follow mode) |
| `jump_interval` | int | 2000 | Time between jumps in milliseconds |
| `atlas` | bool | false | Whether the enemy has animation atlas |
| `death_particle_color` | string | "#ff0000" | Color of death effect particles |

### Movement Methods

#### 1. `static`
Enemy stays in place, no movement.

#### 2. `patrol`
Enemy walks back and forth horizontally on the ground within patrol distance.

#### 3. `jump`
Enemy jumps in place periodically without horizontal movement.

#### 4. `move_and_jump`
Enemy moves forward by jumping (like a frog's natural movement). The enemy waits between jumps.

#### 5. `patrol_jump`
Enemy walks continuously and occasionally jumps while walking.

#### 6. `follow`
Enemy follows the player when within detection range by walking.

#### 7. `follow_jump`
Enemy follows the player and jumps when player is above.

### Examples

#### Jumping Frog (moves by hopping)
```json
{
  "type": "enemy",
  "name": "frog",
  "properties": [
    { "name": "damage", "type": "int", "value": 1 },
    { "name": "move_method", "type": "string", "value": "move_and_jump" },
    { "name": "jump_power", "type": "int", "value": 500 },
    { "name": "jump_interval", "type": "int", "value": 1500 },
    { "name": "atlas", "type": "bool", "value": true }
  ]
}
```

#### Stationary Jumper (jumps in place)
```json
{
  "type": "enemy",
  "name": "slime",
  "properties": [
    { "name": "damage", "type": "int", "value": 1 },
    { "name": "move_method", "type": "string", "value": "jump" },
    { "name": "jump_power", "type": "int", "value": 400 },
    { "name": "jump_interval", "type": "int", "value": 2000 }
  ]
}
```

#### Patrolling Guard
```json
{
  "type": "enemy",
  "name": "guard",
  "properties": [
    { "name": "damage", "type": "int", "value": 2 },
    { "name": "move_method", "type": "string", "value": "patrol" },
    { "name": "move_speed", "type": "int", "value": 150 },
    { "name": "patrol_distance", "type": "int", "value": 300 }
  ]
}
```

#### Following Ghost
```json
{
  "type": "enemy",
  "name": "ghost",
  "properties": [
    { "name": "damage", "type": "int", "value": 1 },
    { "name": "move_method", "type": "string", "value": "follow" },
    { "name": "move_speed", "type": "int", "value": 80 },
    { "name": "detection_range", "type": "int", "value": 400 }
  ]
}
```

### Enemy Interactions

- **Defeating Enemies**: Players can defeat enemies by jumping on them from above
- **Taking Damage**: Contact with enemies from the side or below damages the player
- **Bounce Effect**: Successfully jumping on an enemy bounces the player upward

### Animation Notes

- **Animation Fallback**: If an enemy doesn't have a "walk" animation, it will automatically use "idle" instead
- **Frog Example**: The frog enemy only has "idle" and "jump" animations, perfect for its hopping movement pattern (move_and_jump)

## Player

### Object Type
Set the object type to `player` in Tiled.

### Properties
The player sprite is identified by its texture name (e.g., `character_purple`).

## Hazards

### Object Type
Set the object type to `hazard` in Tiled.

### Configurable Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `damage` | int | 1 | Damage dealt to player on contact |

### Example
```json
{
  "type": "hazard",
  "name": "spikes",
  "properties": [
    { "name": "damage", "type": "int", "value": 1 }
  ]
}
```

## Goals

### Object Type
Set the object type to `goal` in Tiled.

### Properties
Goals mark the level completion point. When the player reaches a goal:
1. The game checks if all `must_collect` items have been collected
2. If requirements are met, the victory screen is shown
3. If not, a visual warning displays the missing items

## Adding New Collectible Types

To add a completely new type of collectible:

1. **Create the sprite/texture** for your item
2. **Add to tilemap** in Tiled editor
3. **Set object type** to `collectible`
4. **Configure properties**:
   ```json
   {
     "type": "collectible",
     "name": "your_item_texture",
     "properties": [
       { "name": "type", "type": "string", "value": "your_category" },
       { "name": "score", "type": "int", "value": 250 },
       { "name": "rotate", "type": "bool", "value": true },
       { "name": "particle_color", "type": "string", "value": "#FF00FF" }
     ]
   }
   ```

**No code changes required!** The system automatically handles any new collectible type.

## Tips

1. **Consistent Types**: Use consistent type names for similar items to group them in the victory screen
2. **Color Coding**: Use particle colors that match the item's appearance for better visual feedback
3. **Score Balance**: Balance score values based on item difficulty to obtain
4. **Required Items**: Use `must_collect` sparingly for key progression items
5. **Visual Hierarchy**: Use rotation for special/valuable items to draw attention