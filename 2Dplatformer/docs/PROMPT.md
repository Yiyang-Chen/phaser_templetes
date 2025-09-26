RESOURCE MANAGEMENT:
- Project uses unified resource system with `public/assets/game_config.json`
- `game_config.json` will start with an empty file. So even if you want to use the same resource as listed in template, you need to register the resource again. Especially the resources (like audio and tilemap) that has another config file and reference to `game_config.json`.
- All assets defined with resource keys, not hardcoded paths
- Use remote configs via URL parameters when possible
- CRITICAL: DO NOT manually edit `game_config.json`
- Use provided registration tools: `register_static_image_asset`, `register_sprite_asset`, `register_ground_asset_package`, `register_audio_asset`
- Always use HTTPS URLs, never HTTP
- See `RESOURCE_MANAGEMENT_GUIDE.md` for detailed instructions

AUDIO CONFIGURATION:
- Audio in audio_config.json are template demos, delete unused keys
- All game audio must be listed in `audio_config.json`
- Audio assets must have corresponding keys in `game_config.json` via `register_audio_asset tool`
- Follow `AUDIO_CONFIGURETION_GUIDE.md` for proper usage
- CRITICAL: Use `register_audio_asset` tool, do not manually edit `game_config.json`

TILEMAP DESIGN:
- Create full maps, avoid empty spaces
- Endpoint can be anywhere, not just right side, but require twists and turns to reach
- Include enemies, traps, collectibles for engaging gameplay
- Design complex maps for player attraction

TILEMAP CONFIGURATION REQUIREMENTS:
- Read `TILEMAP_CONFIGURATION_GUIDE.md` for valid tilemap creation
- Follow `PROPERTY_NAMING_STANDARDS.md` for all property names
- Update `PROPERTY_NAMING_STANDARDS.md` if code changes affect tilemap variables
- Use `register_tilemap` tool after adding tilemap files
- Object name key must match tileset name key exactly
- CRITICAL Tileset naming rules: Static images name equals image, Atlas images use `_image` suffix for image field
- Ensure safe player starting position unless explicitly requested otherwise
- Physics collision must match visual tilemap unless special gameplay case
- Use `tilemap_overlap_modify` tool to check object-terrain overlaps
- Sprite atlases need atlas: true property, terrain tiles need collides: true
- Use appropriate registration tools for different asset types
- System supports properties in both tiles[0].properties and tileset properties arrays, but it is suggested to use tiles[0].properties
- DO NOT manually edit `game_config.json`

