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
        
        // 使用扩展的自定义tilemap加载器 - 自动处理tileset资源
        // 现在返回LoaderPlugin，支持链式调用，Phaser会等待所有资源完成

        this.load.customTilemap('tilemap', 'assets/tilemap/scenes/tilemap.json');

        // Initialize SoundEffectPlayer and load config

        this.soundEffectPlayer.init(this);
        await this.soundEffectPlayer.loadConfig();
        
        // Preload all sound effects
        console.log('[Preloader] Preloading sound effects...');
        this.soundEffectPlayer.preloadSounds();
        

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
        
        // 检查是否有选定的关卡，决定下一步跳转
        const selectedLevel = this.registry.get('selectedLevel');
        if (selectedLevel) {
            console.log('🎮 Preloader: 检测到选定的关卡，直接进入游戏:', selectedLevel);
            this.scene.start('Game');
        } else {
            // 正常流程：进入主菜单
            this.scene.start('MainMenu');
        }
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
