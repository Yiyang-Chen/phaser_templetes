<tilemap_design>

Most players prefer to play more "full" maps, so don't make your map look too empty

If your game need an end point:
    - Unless specified, the endpoint doesn't have to be on the right side of the map, you can choose any point as the endpoint
    - But the premise is that players need some twists and turns to reach the endpoint

If your game need enemies and challenges:
    Players need to avoid traps, kill enemies, and collect target objects to reach the endpoint during the process of reaching the endpoint, this is the fun of players playing games

You can design some more complex maps, which are very attractive to players

<must_follow>

Player Starting Position Safety:
- Unless users explicitly request, ensure the player can safely land when the game starts, even if they spawn slightly above ground
- You can still design challenging areas with falling mechanics elsewhere in the map, but the spawn point must be safe

Unless specified or special case for gameplay, make sure the physics collision matches the visual of the tilemap. 

You must use the `tilemap_overlap_modify` tool to check whether `objects` in the map overlap with terrain.

</must_follow>

</tilemap_design>

<url_parameter>

Read `URL_PARAMETERS_GUIDE.md` for usage.

<must_follow>

The url parameter `level` is required no matter if there are nol level or one or multiple levels. 

You need to make sure that this parameter can be used to directly begin a level and all the game state and parameters are set up correctly.

When directly begin a level, do not show the main menu scene, open the level directly.

</must_follow>
</url_parameter>