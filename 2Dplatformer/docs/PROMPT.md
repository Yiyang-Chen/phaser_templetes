## For All Agents

- **NEVER manually edit `game_config.json`** - use registration tools only
- Project uses unified resource system at `public/assets/game_config.json`
- `game_config.json` starts empty. All resources must be registered, including those with separate config files
- All assets use resource keys, never hardcoded paths or URLs
- Always use HTTPS URLs, never HTTP
- Before modifying config files, read `game_config.json` first
- See `RESOURCE_MANAGEMENT_GUIDE.md` for detailed instructions
- The config files like `audio_config.json` and `tilemap.json` in the template are just examples. If it is the first time to edit the files after clone the project, make sure to start from blank to avoid incorrect key references to `game_config.json`.

---

## Resource Management

- Registration tools: `register_static_image_asset`, `register_sprite_asset`, `register_ground_asset_package`, `register_audio_asset`
- Use remote configs via URL parameters when possible

---

## Audio Configuration

### For Main Agent
- This agent does not have memory and context. Everytime you call the tool, you need to provide the context again.
- After the subagent finished, you can call the `audio_config_check` tool yourself to make sure the subagent does the work correctly. If there are some mistakes, you need to call the subagent again to fix the issues. 

### For Config Subagent

#### Tools
- register_audio_asset
- search_audio
- audio_config_check

#### Guidelines
- Follow `AUDIO_CONFIGURATION_GUIDE.md` for proper usage
- **CRITICAL Structure Requirements**:
  - `audio-config.json` must contain BOTH `audioTypes` AND `assets` sections. AI-generated configs often miss `assets`, causing audio to fail
  - `audioTypes` must contain both `bgm` and `sfx` sections
  - All `sceneMapping` values (e.g., "menu_theme") must exist as keys in `assets.bgm`
  - All `animationMapping` values (e.g., ["player_jump"]) must exist as keys in `assets.sfx`
- **CRITICAL Resource Key Mapping**: The `resourceKey` field in `audio_config.json` must reference a valid `key` field from `game_config.json`. The mapping relationship is: `audio_config.json` → `assets.bgm/sfx.{audio_name}.resourceKey` must match `game_config.json` → `assets[].resources[].remote.key` or `assets[].resources[].local.key`. This establishes the link between audio configuration and actual resource loading paths.
- Remove unused keys and keys not listed in `game_config.json` from `audio_config.json`
- Run `audio_config_check` after modifying audio-config.json to validate structure and references. Tool checks:
  - Structure integrity (audioTypes and assets sections exist)
  - Section completeness (bgm and sfx sections present)
  - Mapping references (sceneMapping and animationMapping values exist in assets)
  - Resource key registration (all resourceKeys exist in game_config.json)
  - Provide: `audio_config_path` (e.g., `public/assets/audio/audio-config.json`) and `game_config_path` (e.g., `public/assets/game_config.json`)
  - Tool reports issues but does not fix them. Use `register_audio_asset` to register missing resources or modify `audi_config.json` to fix the issue

---

## Tilemap Configuration

### For Main Agent
- This agent does not have memory and context. Everytime you call the tool, you need to provide the context again.
- The subagent should have called `register_tilemap`. Check the `project_env.json` file in the project root directory, there should have a tilemap section that contains the infos of the registered tilemap. If the tilemap has been registered you don't need to call `register_tilemap` again.
- After the subagent finished, you can call the `tilemap_overlap` tool yourself to make sure the subagent does the work correctly. If there are some mistakes, you need to call the subagent again to fix the issues. 

### For Config Subagent

#### Tools
- tilemap_overlap_check
- register_tilemap

#### Guidelines
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

### For Code

- Update `PROPERTY_NAMING_STANDARDS.md` if code changes affect tilemap variables or support new properties
