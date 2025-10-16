import { GlobalResourceManager } from '../resourceManager/GlobalResourceManager';
import { AudioLoader } from '../resourceManager/utils/AudioLoader';

/**
 * 音频加载状态
 */
export enum AudioLoadState {
    PENDING = 'pending',     // 未开始加载
    LOADING = 'loading',     // 正在加载中
    LOADED = 'loaded',       // 加载完成
    ERROR = 'error'          // 加载失败
}

/**
 * 音频类型
 */
export enum AudioAssetType {
    BGM = 'bgm',
    SFX = 'sfx'
}

/**
 * 音频资源配置
 */
export interface AudioAssetConfig {
    key: string;
    resourceKey: string;
    preload: boolean;
    volume?: number;
    loop?: boolean;
    type: AudioAssetType;
}

/**
 * 音频资源加载器
 * 封装单个音频资源的加载状态、Phaser音频对象和事件管理
 */
export class AudioAssetLoader {
    private key: string;
    private resourceKey: string;
    private preload: boolean;
    private volume: number;
    private loop: boolean;
    private type: AudioAssetType;
    
    private state: AudioLoadState = AudioLoadState.PENDING;
    private sound: Phaser.Sound.BaseSound | null = null;
    private scene: Phaser.Scene | null = null;
    
    // 事件监听器
    private onLoadCompleteCallbacks: Array<() => void> = [];
    private onLoadErrorCallbacks: Array<(error: Error) => void> = [];

    constructor(config: AudioAssetConfig) {
        this.key = config.key;
        this.resourceKey = config.resourceKey;
        this.preload = config.preload;
        this.volume = config.volume ?? 0.5;
        this.loop = config.loop ?? false;
        this.type = config.type;
    }

    // ===== Getter 方法 =====

    public getKey(): string {
        return this.key;
    }

    public getState(): AudioLoadState {
        return this.state;
    }

    public getSound(): Phaser.Sound.BaseSound | null {
        return this.sound;
    }

    public isPreload(): boolean {
        return this.preload;
    }

    public getType(): AudioAssetType {
        return this.type;
    }

    public isLoaded(): boolean {
        return this.state === AudioLoadState.LOADED;
    }

    public isLoading(): boolean {
        return this.state === AudioLoadState.LOADING;
    }

    public isPending(): boolean {
        return this.state === AudioLoadState.PENDING;
    }

    // ===== 事件注册 =====

    /**
     * 注册加载完成回调
     */
    public onLoadComplete(callback: () => void): void {
        // 如果已经加载完成，立即触发
        if (this.state === AudioLoadState.LOADED) {
            callback();
            return;
        }
        
        this.onLoadCompleteCallbacks.push(callback);
    }

    /**
     * 取消所有加载完成回调
     */
    public clearLoadCompleteCallbacks(): void {
        this.onLoadCompleteCallbacks = [];
    }

    /**
     * 注册加载错误回调
     */
    public onLoadError(callback: (error: Error) => void): void {
        this.onLoadErrorCallbacks.push(callback);
    }

    // ===== 加载相关 =====

    /**
     * 设置场景
     */
    public setScene(scene: Phaser.Scene): void {
        this.scene = scene;
    }

    /**
     * 添加到加载队列
     * 同步方法：添加文件到 Phaser loader 队列并注册事件监听
     * 注意：不会调用 loader.start()，需要外部统一调用
     */
    public addToLoadQueue(): void {
        if (this.state === AudioLoadState.LOADED) {
            console.log(`✅ AudioAssetLoader: ${this.key} 已加载，跳过`);
            return;
        }

        if (this.state === AudioLoadState.LOADING) {
            console.log(`⚠️ AudioAssetLoader: ${this.key} 正在加载中，跳过`);
            return;
        }

        if (!this.scene) {
            console.error(`❌ AudioAssetLoader: ${this.key} 没有设置场景，无法加载`);
            this.state = AudioLoadState.ERROR;
            return;
        }

        // 检查是否已经在缓存中
        if (this.scene.cache.audio.exists(this.key)) {
            console.log(`✅ AudioAssetLoader: ${this.key} 已在缓存中，直接创建音频对象`);
            this.createSoundObject();
            this.state = AudioLoadState.LOADED;
            this.triggerLoadComplete();
            return;
        }

        this.state = AudioLoadState.LOADING;
        console.log(`🔄 AudioAssetLoader: 添加到加载队列 ${this.key} (${this.type})`);

        // 添加到队列并注册事件（同步操作）

        // 通过 GlobalResourceManager 解析实际URL
        const resourceManager = GlobalResourceManager.getInstance();
        const actualUrl = resourceManager.getResourcePath(this.resourceKey);

        if (!actualUrl) {
            console.error(`❌ AudioAssetLoader: ${this.key} 无法解析资源路径: ${this.resourceKey}`);
            this.state = AudioLoadState.ERROR;
            return;
        }

        // 添加文件到 loader 队列
        AudioLoader.loadMultiFormat(this.scene.load, this.key, actualUrl);

        // 使用 filecomplete 事件监听特定文件的加载完成
        // Phaser 事件格式: filecomplete-audio-{key}
        const eventKey = `filecomplete-audio-${this.key}`;
        
        const fileCompleteHandler = () => {
            console.log(`✅ AudioAssetLoader: ${this.key} 加载完成`);
            this.createSoundObject();
            this.state = AudioLoadState.LOADED;
            
            // 处理别名
            AudioLoader.processPendingAliases(this.key, this.scene!);
            
            // 移除监听器
            this.scene!.load.off(eventKey, fileCompleteHandler);
            this.scene!.load.off('loaderror', loaderErrorHandler);
            
            this.triggerLoadComplete();
        };

        const loaderErrorHandler = (file: any) => {
            if (file.key === this.key) {
                console.error(`❌ AudioAssetLoader: ${this.key} 加载错误`, file);
                this.state = AudioLoadState.ERROR;
                
                // 移除监听器
                this.scene!.load.off(eventKey, fileCompleteHandler);
                this.scene!.load.off('loaderror', loaderErrorHandler);
                
                this.triggerLoadError(new Error(`Failed to load audio "${this.key}" from "${actualUrl}"`));
            }
        };

        // 监听特定文件的加载完成
        this.scene.load.once(eventKey, fileCompleteHandler);
        this.scene.load.on('loaderror', loaderErrorHandler);
    }

    /**
     * 创建音频对象
     */
    private createSoundObject(): void {
        if (!this.scene || this.sound) return;

        try {
            const actualKey = AudioLoader.getActualKey(this.key);
            const cacheKey = this.scene.cache.audio.exists(actualKey) ? actualKey :
                            this.scene.cache.audio.exists(this.key) ? this.key : null;

            if (!cacheKey) {
                console.error(`❌ AudioAssetLoader: ${this.key} 在缓存中不存在`);
                return;
            }

            this.sound = this.scene.sound.add(cacheKey, {
                volume: this.volume,
                loop: this.loop
            });
        } catch (error) {
            console.error(`❌ AudioAssetLoader: ${this.key} 创建音频对象失败:`, error);
        }
    }

    /**
     * 触发加载完成回调
     */
    private triggerLoadComplete(): void {
        const callbacks = [...this.onLoadCompleteCallbacks];
        this.onLoadCompleteCallbacks = [];
        
        callbacks.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error(`❌ AudioAssetLoader: ${this.key} 回调执行失败:`, error);
            }
        });
    }

    /**
     * 触发加载错误回调
     */
    private triggerLoadError(error: Error): void {
        this.onLoadErrorCallbacks.forEach(callback => {
            try {
                callback(error);
            } catch (err) {
                console.error(`❌ AudioAssetLoader: ${this.key} 错误回调执行失败:`, err);
            }
        });
    }

    // ===== 播放控制 =====

    /**
     * 播放音频
     */
    public play(volume?: number, loop?: boolean): boolean {
        if (!this.sound) {
            console.warn(`⚠️ AudioAssetLoader: ${this.key} 音频对象不存在，无法播放`);
            return false;
        }

        if (this.state !== AudioLoadState.LOADED) {
            console.warn(`⚠️ AudioAssetLoader: ${this.key} 未加载完成，无法播放`);
            return false;
        }

        try {
            // 设置音量和循环
            if (volume !== undefined && 'setVolume' in this.sound) {
                (this.sound as any).setVolume(volume);
            }
            
            if (loop !== undefined && 'setLoop' in this.sound) {
                (this.sound as any).setLoop(loop);
            }

            this.sound.play();
            console.log(`▶️ AudioAssetLoader: ${this.key} 开始播放`);
            return true;
        } catch (error) {
            console.error(`❌ AudioAssetLoader: ${this.key} 播放失败:`, error);
            return false;
        }
    }

    /**
     * 停止播放
     */
    public stop(): void {
        if (this.sound && this.sound.isPlaying) {
            this.sound.stop();
            console.log(`⏹️ AudioAssetLoader: ${this.key} 停止播放`);
        }
    }

    /**
     * 暂停播放
     */
    public pause(): void {
        if (this.sound && this.sound.isPlaying) {
            this.sound.pause();
            console.log(`⏸️ AudioAssetLoader: ${this.key} 暂停播放`);
        }
    }

    /**
     * 恢复播放
     */
    public resume(): void {
        if (this.sound && !this.sound.isPlaying) {
            this.sound.resume();
            console.log(`▶️ AudioAssetLoader: ${this.key} 恢复播放`);
        }
    }

    /**
     * 设置音量
     */
    public setVolume(volume: number): void {
        if (this.sound && 'setVolume' in this.sound) {
            (this.sound as any).setVolume(volume);
        }
    }

    /**
     * 检查是否正在播放
     */
    public isPlaying(): boolean {
        return this.sound?.isPlaying ?? false;
    }

    // ===== 清理 =====

    /**
     * 销毁音频资源
     */
    public destroy(): void {
        this.clearLoadCompleteCallbacks();
        this.onLoadErrorCallbacks = [];

        if (this.sound) {
            try {
                this.sound.destroy();
            } catch (error) {
                console.error(`❌ AudioAssetLoader: ${this.key} 销毁失败:`, error);
            }
            this.sound = null;
        }

        this.scene = null;
        console.log(`🧹 AudioAssetLoader: ${this.key} 已清理`);
    }
}

