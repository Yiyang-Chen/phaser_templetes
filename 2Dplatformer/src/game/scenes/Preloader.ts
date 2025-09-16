import { Scene } from 'phaser';
import { AnimationManager } from '../managers/AnimationManager';
import { AudioManager } from '../audio/AudioManager';
import { URLParameterManager } from '../utils/URLParameterManager';

export class Preloader extends Scene
{
    private animationManager: AnimationManager;
    private audioManager: AudioManager;
    
    constructor ()
    {
        super('Preloader');
        this.animationManager = AnimationManager.getInstance();
        this.audioManager = AudioManager.getInstance();
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

        // 初始化管理器 - 在资源加载之前准备好
        this.audioManager.initialize(this, this.game);
        this.animationManager.init(this);
    }

    preload ()
    {
        //  Load the assets for the game - Replace with your own assets
        this.load.image('logo', 'assets/logo.png');
        
        // 使用扩展的自定义tilemap加载器 - 自动处理tileset资源
        this.load.customTilemap('tilemap', 'assets/tilemap/scenes/tilemap.json');

        // 使用自定义音频配置加载器 - 自动处理音频资源加载
        this.load.audioConfig('audio-config', '/assets/audio/audio-config.json');
    }


    create ()
    {
        // 处理已加载的动画配置
        this.processAnimationConfigs();
        
        // 创建所有动画
        this.animationManager.createAllAnimations();
        
        // 处理已加载的音频资源
        this.audioManager.processLoadedAudio();
        
        // 检查是否有选定的关卡，决定下一步跳转
        const urlParams = URLParameterManager.getInstance();
        if (urlParams.hasLevel()) {
            const selectedLevel = urlParams.getLevel();
            console.log(`[Preloader] 检测到选定的关卡，直接进入游戏: ${selectedLevel}`);
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
            // Check if this texture is marked as atlas in tilemap
            if (this.isAtlasTexture(key)) {
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
    
    /**
     * Check if a texture is marked as atlas in tilemap configuration
     */
    private isAtlasTexture(textureKey: string): boolean {
        // Check if tilemap is loaded
        if (!this.cache.tilemap.exists('tilemap')) {
            return false;
        }
        
        const tilemapData = this.cache.tilemap.get('tilemap');
        if (!tilemapData || !tilemapData.data || !tilemapData.data.tilesets) {
            return false;
        }
        
        // Look for this texture in tilesets
        for (const tileset of tilemapData.data.tilesets) {
            if (tileset.name === textureKey) {
                // Check if this tileset has tiles with atlas property
                if (tileset.tiles) {
                    for (const tile of tileset.tiles) {
                        if (tile.properties) {
                            for (const prop of tile.properties) {
                                if (prop.name === 'atlas' && prop.value === true) {
                                    return true;
                                }
                            }
                        }
                    }
                }
                break;
            }
        }
        
        return false;
    }
}
