import { Scene } from 'phaser';
import { AnimationManager } from '../managers/AnimationManager';
import { AudioManager } from '../audio/AudioManager';

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
    }

    preload ()
    {
        //  Load the assets for the game - Replace with your own assets
        this.load.image('logo', 'assets/logo.png');
        
        // 使用扩展的自定义tilemap加载器 - 自动处理tileset资源
        this.load.customTilemap('tilemap', 'assets/tilemap/scenes/tilemap.json');

        // 使用自定义音频配置加载器 - 自动处理音频资源加载
        // 这会加载配置文件并自动添加音频资源到Phaser的加载队列
        console.log('[Preloader] 添加音频配置到加载队列...');
        this.load.audioConfig('audio-config', '/assets/audio/audio-config.json');
    }


    async create ()
    {
        // Initialize AnimationManager with this scene
        this.animationManager.init(this);
        
        // Process all loaded animation configurations
        this.processAnimationConfigs();
        
        // Create all animations
        this.animationManager.createAllAnimations();
        
        // 初始化AudioManager（跳过配置加载，因为已经通过自定义加载器完成）

        await this.audioManager.initialize(this, this.game, true); // skipConfigLoad = true
        
        // 处理已加载的音频资源
        console.log('[Preloader] 处理已加载的音频资源...');
        this.audioManager.processLoadedAudio();
        console.log('[Preloader] 音频系统准备就绪');
        
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
