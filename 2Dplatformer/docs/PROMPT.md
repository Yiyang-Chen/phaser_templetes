<for_all_agents>
- **NEVER manually edit `game_config.json`** - use registration tools only
- Project uses unified resource system at `public/assets/game_config.json`
- `game_config.json` starts empty. All resources must be registered, including those with separate config files
- All assets use resource keys, never hardcoded paths or URLs
- Always use HTTPS URLs, never HTTP
- Before modifying config files, read `game_config.json` first
- See `RESOURCE_MANAGEMENT_GUIDE.md` for detailed instructions
- The config files like `audio_config.json` and `tilemap.json` in the template are just examples. If it is the first time to edit the files after clone the project, make sure to start from blank to avoid incorrect key references to `game_config.json`. 
</for_all_agents>

<resource_management>
- Registration tools: `register_static_image_asset`, `register_sprite_asset`, `register_ground_asset_package`, `register_audio_asset`
- Use remote configs via URL parameters when possible
</resource_management>

<audio_configuration>
<for_config_subagent>
<additional_tool_list>
`register_audio_asset`, `search_audio`
</additional_tool_list>
- Follow `AUDIO_CONFIGURATION_GUIDE.md` for proper usage
- All game audio must be listed in `audio_config.json`
- Remove unused keys from `audio_config.json`
- All audio resources in `audio_config.json` must exist in `game_config.json`. Use `register_audio_asset` to register
- **CRITICAL**: `audio-config.json` must contain BOTH `audioTypes` AND `assets` sections. AI-generated configs often miss `assets`, causing audio to fail
</for_config_subagent>
</audio_configuration>

<tilemap_configuration>
<for_config_subagent>
<additional_tool_list>
`tilemap_overlap_check`, `register_tilemap`
</additional_tool_list>
- Read `TILEMAP_CONFIGURATION_GUIDE.md` and follow `PROPERTY_NAMING_STANDARDS.md` for all property names
- Embed tileset image references in tilemap JSON; do not use external `.tsx` files
- Every tileset entry must include: `firstgid`, `image`, `imageheight`, `imagewidth`, `tileheight`, `tilewidth`, `name`, `tilecount`
- **Tileset Configuration Rules**: 
  - **Naming Convention**: 
    * Object name key must match tileset name key exactly
    * Static images: `name` and `image` fields must be identical
    * Atlas images: `image` field uses `_image` suffix, `name` field does not
    * Tileset `image` must be a resource key from `game_config.json`, never URLs or file paths
  - **Properties Placement**: 
    * Read `PROPERTY_NAMING_STANDARDS.md` for allowed properties
    * Use `tiles` array for tile properties (preferred over direct `properties` field)
    * Sprite atlases need `atlas: true`, terrain tiles need `collides: true`
  - **Common Issues**: 
    * Incorrect naming → texture loading failures
    * Wrong property placement → tile behavior not working
    * Using URLs/paths instead of resource keys → GlobalResourceManager errors
- Object layers reference tiles via `gid` with meaningful `name` and `type` values (e.g., `player`, `enemy`, `collectible`)
- Run `tilemap_overlap_check` after major changes. Provide:
  - `tilemap_path`: absolute path to tilemap JSON
  - `assets_dir`: absolute path to asset root (typically `<project>/public`)
  - Tool fixes most problems. For `sizeMismatch`, fix tilemap array length manually
- After tilemap stabilizes, call `tilemap_overlap_check` then `register_tilemap`. Provide:
  - `level_name`: scene identifier
  - `tilemap_public_path`: JSON path relative to `public_root` (e.g., `levels/level1.json`)
  - `config_path`: absolute `game_config.json` path (`/public/assets/game_config.json`)
  - `description`: brief summary of changes
- Modify existing tilemap files instead of creating new ones for the same level
- Create rich, engaging levels with meaningful challenges throughout. Avoid empty spaces
- Ensure safe player starting position and matching physics collision unless special gameplay requires otherwise
</for_config_subagent>
<for_code>
- Update `PROPERTY_NAMING_STANDARDS.md` if code changes affect tilemap variables or support new properties
</for_code>
</tilemap_configuration>

