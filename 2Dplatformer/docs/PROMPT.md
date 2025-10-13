<resource_management>
- Project uses unified resource system with `public/assets/game_config.json`
- `game_config.json` will start with an empty file. So even if you want to use the same resource as listed in template, you need to register the resource again. Especially the resources (like audio and tilemap) that has another config file and reference to `game_config.json`.
- All assets defined with resource keys, not hardcoded paths
- Use remote configs via URL parameters when possible
- CRITICAL: DO NOT manually edit `game_config.json`
- Use provided registration tools: `register_static_image_asset`, `register_sprite_asset`, `register_ground_asset_package`, `register_audio_asset`
- Always use HTTPS URLs, never HTTP
- See `RESOURCE_MANAGEMENT_GUIDE.md` for detailed instructions
</resource_management>

<audio_configuration>
<for_config_subagent>
<additional_tool_list>
`register_audio_asset`
</additional_tool_list>
- Follow `AUDIO_CONFIGURETION_GUIDE.md` for proper usage
- Brefore modify `audio_config.json` you need to read through `game_config.json`
- Audio delete unused keys in `audio_config.json`
- All game audio must be listed in `audio_config.json`
- CRITICAL: Use `register_audio_asset` tool, do not manually edit `game_config.json`
- **CRITICAL**: You must check if all the audio resources used in `audio_config.json` can be found in `game_config.json`. You must call 'register_audio_asset' tool if you want to use the audio in your game.
- **🚨 CRITICAL**: `audio-config.json` must contain BOTH `audioTypes` AND `assets` sections. AI-generated configs often miss the `assets` section, causing audio to fail. Always verify complete structure before use.
</for_config_subagent>
</audio_configuration>

<tilemap_configuration>
<for_config_subagent>
<additional_tool_list>
`tilemap_overlap_check`, `register_tilemap`
</additional_tool_list>
- Read `TILEMAP_CONFIGURATION_GUIDE.md` for valid tilemap creation and follow `PROPERTY_NAMING_STANDARDS.md` for all property names.
- Brefore modify tilemap json files you need to read through `game_config.json`
- Embed tileset image references directly in the tilemap JSON; do not point to external `.tsx` files.
- Every tileset entry must include `firstgid`, `image`, `imageheight`, `imagewidth`, `tileheight`, `tilewidth`, `name`, and `tilecount`.
- **CRITICAL - Tileset Configuration Rules**: 
  - **Naming Convention**: 
    * Object name key must match tileset name key exactly
    * Static images: `name` and `image` fields must be identical
    * Atlas images: `image` field uses `_image` suffix, `name` field does not
    * **CRITICAL**: tileset `image` must be a resource key from `game_config.json`, never URLs or file paths
  - **Properties Placement**: 
    * Read `PROPERTY_NAMING_STANDARDS.md` for properties allowed to write in tilemap, all the other properties are not allowed, unless you update the code.
    * Use `tiles` array for tile properties instead of direct `properties` field in tilesets.
    * System supports properties in both tiles[0].properties and tileset properties arrays, but it is suggested to use tiles[0].properties
    * Sprite atlases need atlas: true property, terrain tiles need collides: true
  - **⚠️ Common Issues**: 
    * Incorrect naming → texture loading failures and blank terrain
    * Wrong property placement → tile behavior not working as expected
    * Using URLs or file paths instead of resource keys → GlobalResourceManager errors
- Object layers should reference tiles via `gid` and annotate objects with meaningful `name` and `type` values (for example `player`, `enemy`, `collectible`, `goal`).
- After major changes, run `tilemap_overlap_check` to ensure objects do not overlap solid tiles and perform other validation checks. Provide:
  - `tilemap_path`: the absolute path to the tilemap JSON.
  - `assets_dir`: the absolute path to the asset root (typically `<project>/public`).
  The tool will return some important check results and fix most of the problems. For `sizeMismatch`, it means your tilemap array is longer than your width * height. You need to fix it yourself.
- Whenever a tilemap version stabilizes, call `tilemap_overlap_check` and then `register_tilemap` to keep `game_config.json` aligned with upstream systems. Make sure the tilemap JSON lives inside the registered `public_root`, then provide:
  - `level_name`: the identifier for this scene inside the game.
  - `tilemap_public_path`: the JSON path relative to `public_root` (for example `levels/level1.json`).
  - `config_path`: the absolute `game_config.json` path you supplied to `register_project`. The file relative path should be /public/assets/game_config.json
  - `description`: a brief summary of the changes.
- For one level, if a tilemap already exists, modify the original file instead of creating a brand-new one.
- Make the level content rich and engaging; create full maps and avoid empty spaces. The endpoint can live anywhere (not just right side) as long as the journey includes meaningful challenges (obstacles, enemies, collectibles, twists and turns). Design complex maps for player attraction.
- Ensure safe player starting position unless explicitly requested otherwise. Physics collision must match visual tilemap unless special gameplay case.
</for_config_subagent>
<for_code>
- Update `PROPERTY_NAMING_STANDARDS.md` if code changes affect tilemap variables.
- If you update the codebase to support more properties, update `PROPERTY_NAMING_STANDARDS.md` so that you can set properties correctly.
</for_code>
<attention_for_all_agents>
- Never edit `assets/game_config.json` directly; update it only through the provided tools (`register_project`, `batch_register_assets`, `register_tilemap`) so the shared configuration stays consistent. Every `image` field in the tilemap tilesets must use keys returned by `batch_register_assets`, and using unregistered assets is strictly forbidden. Use appropriate registration tools for different asset types.
</attention_for_all_agents>
</tilemap_configuration>

