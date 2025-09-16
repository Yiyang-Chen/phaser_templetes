import { AudioManager, AudioType, AudioConfig } from '../../audio/AudioManager';
import { GlobalResourceManager } from '../GlobalResourceManager';

/**
 * 自定义音频配置文件加载器
 * 负责加载音频配置并自动添加音频资源到Phaser加载队列
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
            
            // 根据配置动态添加音频资源到加载队列
            this.addAudioAssetsToQueue(configData);
            
            this.data = configData;
            console.log(`✅ AudioConfig: 音频配置处理完成 ${this.key}`);
            this.onProcessComplete();
            
        } catch (error) {
            console.error(`❌ AudioConfig: 处理失败 ${this.key}`, error);
            this.onProcessError();
        }
    }

    /**
     * 根据配置添加音频资源到加载队列
     */
    private addAudioAssetsToQueue(config: AudioConfig): void {
        let addedCount = 0;
        const resourceManager = GlobalResourceManager.getInstance();
        
        // 添加BGM资源
        if (!this.audioType || this.audioType === AudioType.BGM) {
            for (const [key, asset] of Object.entries(config.assets.bgm)) {
                if (asset.preload && !this.loader.scene.cache.audio.exists(key)) {
                    // 从全局资源管理器获取实际路径
                    const actualPath = resourceManager.getResourcePath(asset.url);
                    if (actualPath) {
                        console.log(`🎵 AudioConfig: 添加BGM到队列 - ${key} (${asset.url} -> ${actualPath})`);
                        this.loader.audio(key, actualPath);
                        addedCount++;
                    } else {
                        console.error(`❌ AudioConfig: 无法找到BGM资源路径: ${asset.url}`);
                    }
                }
            }
        }
        
        // 添加SFX资源
        if (!this.audioType || this.audioType === AudioType.SFX) {
            for (const [key, asset] of Object.entries(config.assets.sfx)) {
                if (asset.preload && !this.loader.scene.cache.audio.exists(key)) {
                    // 从全局资源管理器获取实际路径
                    const actualPath = resourceManager.getResourcePath(asset.url);
                    if (actualPath) {
                        console.log(`🔊 AudioConfig: 添加SFX到队列 - ${key} (${asset.url} -> ${actualPath})`);
                        this.loader.audio(key, actualPath);
                        addedCount++;
                    } else {
                        console.error(`❌ AudioConfig: 无法找到SFX资源路径: ${asset.url}`);
                    }
                }
            }
        }
        
        console.log(`🎵 AudioConfig: 总共添加了 ${addedCount} 个音频资源到加载队列`);
    }
}
