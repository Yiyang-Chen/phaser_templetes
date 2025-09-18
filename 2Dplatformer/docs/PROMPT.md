<game_config>

🆕 **Resource Management System**:
- The project uses a unified resource management system with `game_config.json`
- All assets are defined in `public/assets/game_config.json` with resource keys
- Tilemap and audio configs use resource keys instead of hardcoded paths
- Boot scene loads configuration in preload() phase
- You need to use remote configs via URL parameters if possible, instead of local path

`RESOURCE_MANAGEMENT_GUIDE.md`: this test feature is only available for 2d templete for now
You must modify game_config.json to manage resource and use url instead of local path as much as possible. For the url, you need to use HTTPS url as mentioned in the `RESOURCE_MANAGEMENT_GUIDE.md` file.

<must_follow>

Never use http url in the code, you must use https url.

</must_follow>

</game_config>

<audio_design>
<must_follow>

You must follow `docs/AUDIO_CONFIGURETION_GUIDE.md` to understand how to correctly use `audio_config.json`.

All the audio assets listed in the `audio_config.json` should be able to find the keys in `game_config.json`.

</must_follow>
</audio_design>

<tilemap_design>

Most players prefer to play more "full" maps, so don't make your map look too empty

If your game need an end point:
    - Unless specified, the endpoint doesn't have to be on the right side of the map, you can choose any point as the endpoint
    - But the premise is that players need some twists and turns to reach the endpoint

If your game need enemies and challenges:
    Players need to avoid traps, kill enemies, and collect target objects to reach the endpoint during the process of reaching the endpoint, this is the fun of players playing games

You can design some more complex maps, which are very attractive to players

<must_follow>

You must read `docs/TILEMAP_CONFIGURATION_GUIDE.md` to understand how to make a valid tilemap file.

Player Starting Position Safety:
- Unless users explicitly request, ensure the player can safely land when the game starts, even if they spawn slightly above ground
- You can still design challenging areas with falling mechanics elsewhere in the map, but the spawn point must be safe

Unless specified or special case for gameplay, make sure the physics collision matches the visual of the tilemap. 

You must use the `tilemap_overlap_modify` tool to check whether `objects` in the map overlap with terrain.

Make sure to correctly config Sprite Atlas Configuration
- If resources (animated player, enemies) are sprite atlases, NOT regular images
- Resources are now referenced by keys defined in `game_config.json`
- Read `TILEMAP_CONFIGURATION_GUIDE` and `RESOURCE_MANAGEMENT_GUIDE` for detailed explanation

In `game_config.json`, make sure the `key` of tilemap in each scene matches in code and can be correctly loaded.

</must_follow>

</tilemap_design>