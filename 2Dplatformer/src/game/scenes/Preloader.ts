import { Scene } from 'phaser';
import { AnimationManager } from '../managers/AnimationManager';
import { SoundEffectPlayer } from '../managers/SoundEffectPlayer';

export class Preloader extends Scene
{
    private animationManager: AnimationManager;
    private soundEffectPlayer: SoundEffectPlayer;
    
    constructor ()
    {
        super('Preloader');
        this.animationManager = AnimationManager.getInstance();
        this.soundEffectPlayer = SoundEffectPlayer.getInstance();
    }

    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(512, 384, 'background');

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress: number) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    async preload ()
    {
        //  Load the assets for the game - Replace with your own assets
        this.load.image('logo', 'assets/logo.png');
        
        // Load tilemap JSON
        this.load.tilemapTiledJSON('tilemap', 'assets/tilemap/scenes/tilemap.json');

        // Download tilemap.
        this.load.text('tilemap_json_raw', 'assets/tilemap/scenes/tilemap.json');
        
        // Listen for text file loading completion, then load other resources during preload phase
        this.load.once('filecomplete-text-tilemap_json_raw', () => {
            this.loadAllAssets();
        });

        // Initialize SoundEffectPlayer and load config
        console.log('[Preloader] Initializing SoundEffectPlayer...');
        this.soundEffectPlayer.init(this);
        await this.soundEffectPlayer.loadConfig();
        
        // Preload all sound effects
        console.log('[Preloader] Preloading sound effects...');
        this.soundEffectPlayer.preloadSounds();
        

    }

    private loadAllAssets() {
        // parse raw tilemap json.
        let tilemapJsonRaw = this.cache.text.get('tilemap_json_raw');
        let tilemapJsonObj = null;
        try {
            tilemapJsonObj = JSON.parse(tilemapJsonRaw);
        } catch (e) {
            console.error('Failed to parse tilemap_json_raw:', e);
        }

        let tilesets = tilemapJsonObj["tilesets"];
        if (!tilesets) {
            return;
        }

        tilesets.forEach((tileset: any) => {
            let isAtlas = false;

            let tiles = tileset["tiles"];
            if (tiles && tiles.length && tiles.length > 0) {
                let properties = tiles[0]["properties"];
                if (properties && properties.length && properties.length > 0) {
                    properties.forEach((property: any) => {
                        if (property.name === "atlas" && property.value === true) {
                            isAtlas = true;
                        }
                    })
                }
            }
            
            let imageUri = tileset["image"] as string;
            if (!imageUri) {
                return;
            }
            
            let name = tileset["name"] as string;
            if (!name) {
                return;
            }

            if (isAtlas) {
                // Replace the file extension of imageUri with .json
                let atlasJsonUri = imageUri.replace(/(\.[^/.]+)$/, '.json');
                this.load.atlas(name, imageUri, atlasJsonUri);
                
                // Load animation configuration if it exists
                let animationConfigUri = imageUri.replace(/(\.[^/.]+)$/, '_animators.json');
                this.load.json(`${name}_animations`, animationConfigUri);
            } else {
                this.load.image(name, imageUri);
                console.log("load image", name, imageUri)
            }
        })
    }

    create ()
    {
        // Initialize AnimationManager with this scene
        this.animationManager.init(this);
        
        // Process all loaded animation configurations
        this.processAnimationConfigs();
        
        // Create all animations
        this.animationManager.createAllAnimations();
        
        // Initialize loaded sounds after all audio files are loaded
        console.log('[Preloader] Initializing loaded sounds...');
        this.soundEffectPlayer.onSoundsLoaded();
        console.log('[Preloader] Sound effect system ready');
        
        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }
    
    private processAnimationConfigs(): void {
        // Get all loaded atlas names from cache
        const textureKeys = this.textures.getTextureKeys();
        
        for (const key of textureKeys) {
            // Check if this is an atlas (has frames)
            const texture = this.textures.get(key);
            if (texture && texture.frameTotal > 1) {
                // Check if we have animation config for this atlas
                const animConfigKey = `${key}_animations`;
                if (this.cache.json.exists(animConfigKey)) {
                    const animConfig = this.cache.json.get(animConfigKey);
                    if (animConfig) {
                        // Load using legacy format
                        this.animationManager.loadLegacyAnimationConfig(animConfig);
                    }
                }
            }
        }
    }
}
