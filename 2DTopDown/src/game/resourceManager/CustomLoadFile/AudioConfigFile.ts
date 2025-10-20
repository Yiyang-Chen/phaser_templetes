import { AudioManager, AudioType, AudioConfig } from '../../audio/AudioManager';

/**
 * 自定义音频配置文件加载器
 * 负责加载音频配置并通知AudioManager进行音频资源预加载
 */
export class AudioConfigFile extends Phaser.Loader.File {
    private audioType?: AudioType;

    constructor(loader: Phaser.Loader.LoaderPlugin, key: string, url: string, audioType?: AudioType) {
        const fileConfig = {
            type: 'audioConfig',
            cache: loader.scene.cache.json,
            extension: 'json',
            responseType: 'text' as XMLHttpRequestResponseType,
            key: key,
            url: url
        };

        super(loader, fileConfig);
        this.audioType = audioType;
    }

    /**
     * 处理加载完成的音频配置文件
     */
    onProcess(): void {
        console.log(`🎵 AudioConfig: 开始处理音频配置 ${this.key}`);
        
        try {
            const configData: AudioConfig = JSON.parse(this.xhrLoader?.responseText || '{}');
            
            // 将配置存储到缓存中
            this.loader.scene.cache.json.add(this.key, configData);
            
            // 初始化AudioManager（如果还没有初始化）
            const audioManager = AudioManager.getInstance();
            if (!audioManager.isReady()) {
                // 直接设置配置，跳过网络加载
                (audioManager as any).setConfig(configData);
                console.log('🎵 AudioConfig: AudioManager配置已设置');
            }
            
            // 通知AudioManager进行音频预加载
            this.notifyAudioManagerForPreload(configData);
            
            this.data = configData;
            console.log(`✅ AudioConfig: 音频配置处理完成 ${this.key}`);
            this.onProcessComplete();
            
        } catch (error) {
            console.error(`❌ AudioConfig: 处理失败 ${this.key}`, error);
            this.onProcessError();
        }
    }

    /**
     * 通知AudioManager进行音频预加载
     */
    private async notifyAudioManagerForPreload(config: AudioConfig): Promise<void> {
        const audioManager = AudioManager.getInstance();

        try {
            console.log('🎵 AudioConfig: 通知AudioManager进行预加载...');
            await audioManager.preloadFromConfig(config, this.audioType, this.loader.scene);
            console.log('✅ AudioConfig: AudioManager预加载完成');
        } catch (error) {
            console.error('❌ AudioConfig: AudioManager预加载失败:', error);
        }
    }

}
