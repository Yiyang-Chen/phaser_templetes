import { eventBus, GameEvent } from '../events/EventBus';
import { AudioAssetLoader, AudioAssetType, AudioAssetConfig } from './AudioAssetLoader';

// 音频类型枚举（向后兼容）
export enum AudioType {
    BGM = 'bgm',
    SFX = 'sfx'
}

// 音频资源接口
export interface AudioAsset {
    url: string;
    preload?: boolean;
    volume?: number;
    loop?: boolean;
}

// 音频配置接口
export interface AudioConfig {
    audioTypes: {
        bgm: {
            defaultVolume: number;
            loop: boolean;
            sceneMapping: { [sceneName: string]: string };
        };
        sfx: {
            defaultVolume: number;
            loop: boolean;
            animationMapping: {
                [atlasKey: string]: {
                    [animationName: string]: string[];
                };
            };
        };
    };
    assets: {
        bgm: { [key: string]: AudioAsset };
        sfx: { [key: string]: AudioAsset };
    };
}

/**
 * 统一音频管理器
 * 管理BGM和SFX的加载、播放、控制
 */
export class AudioManager {
    private static instance: AudioManager;
    private scene: Phaser.Scene | null = null;
    private game: Phaser.Game | null = null;
    private config: AudioConfig | null = null;
    
    // 音频加载器映射
    private audioLoaders: Map<string, AudioAssetLoader> = new Map();
    
    // BGM相关
    private currentBGMKey: string | null = null;
    private currentBGMLoader: AudioAssetLoader | null = null;
    private currentScene: string | null = null;
    
    // SFX相关
    private animationToSounds: Map<string, string[]> = new Map();
    
    // 状态
    private isInitialized: boolean = false;
    private configLoaded: boolean = false;
    private audioUnlocked: boolean = false;
    private userInteractionListeners: (() => void)[] = [];
    
    // 预加载计数（用于进度条）
    private preloadTotal: number = 0;
    private preloadLoaded: number = 0;

    // ===== 单例模式 =====

    private constructor() {}

    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    // ===== 初始化相关 =====

    /**
     * 初始化音频管理器
     */
    public async initialize(scene: Phaser.Scene, game?: Phaser.Game): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        console.log('🎵 AudioManager: 开始初始化...');
        
        this.scene = scene;
        this.game = game || scene.game;
    
        this.setupEventListeners();
        this.setupSceneListener();
        this.setupUserInteractionListeners();
        
        this.isInitialized = true;
        console.log('✅ AudioManager: 初始化完成');
    }

    /**
     * 直接设置配置（用于自定义加载器）
     */
    public setConfig(config: AudioConfig): void {
        console.log('📋 AudioManager: 直接设置配置...');
        this.config = config;
        this.configLoaded = true;
        
        // 创建所有 AudioAssetLoader 实例
        this.createAudioLoaders();
        
        // 构建动画音效映射
        this.buildAnimationSoundMap();
        
        console.log('✅ AudioManager: 配置设置成功');
    }

    /**
     * 创建所有 AudioAssetLoader 实例
     */
    private createAudioLoaders(): void {
        if (!this.config) return;

        console.log('🔨 AudioManager: 创建 AudioAssetLoader 实例...');
        let count = 0;

        // 创建 BGM 加载器
        for (const [key, asset] of Object.entries(this.config.assets.bgm)) {
            const loaderConfig: AudioAssetConfig = {
                key,
                url: asset.url,
                preload: asset.preload ?? false,
                volume: asset.volume ?? this.config.audioTypes.bgm.defaultVolume,
                loop: asset.loop ?? this.config.audioTypes.bgm.loop,
                type: AudioAssetType.BGM
            };
            
            const loader = new AudioAssetLoader(loaderConfig);
            if (this.scene) {
                loader.setScene(this.scene);
            }
            
            this.audioLoaders.set(key, loader);
            count++;
            
            console.log(`  📦 创建 BGM Loader: ${key} (preload: ${loaderConfig.preload})`);
        }

        // 创建 SFX 加载器
        for (const [key, asset] of Object.entries(this.config.assets.sfx)) {
            const loaderConfig: AudioAssetConfig = {
                key,
                url: asset.url,
                preload: asset.preload ?? false,
                volume: asset.volume ?? this.config.audioTypes.sfx.defaultVolume,
                loop: asset.loop ?? this.config.audioTypes.sfx.loop,
                type: AudioAssetType.SFX
            };
            
            const loader = new AudioAssetLoader(loaderConfig);
            if (this.scene) {
                loader.setScene(this.scene);
            }
            
            this.audioLoaders.set(key, loader);
            count++;
            
            console.log(`  📦 创建 SFX Loader: ${key} (preload: ${loaderConfig.preload})`);
        }

        console.log(`✅ AudioManager: 创建了 ${count} 个 AudioAssetLoader 实例`);
    }

    /**
     * 构建动画音效映射
     */
    private buildAnimationSoundMap(): void {
        if (!this.config) return;
        
        console.log('🗺️ AudioManager: 构建动画音效映射...');
        let mappingCount = 0;
        
        const animationMapping = this.config.audioTypes.sfx.animationMapping;
        for (const [atlasKey, animations] of Object.entries(animationMapping)) {
            for (const [animationName, soundKeys] of Object.entries(animations)) {
                const animKey = `${atlasKey}_${animationName}`;
                this.animationToSounds.set(animKey, soundKeys);
                if (soundKeys.length > 0) {
                    console.log(`  🎭 映射 ${animKey} -> ${soundKeys.length} 个音效`);
                    mappingCount++;
                }
            }
        }
        
        console.log(`✅ AudioManager: 构建了 ${mappingCount} 个动画音效映射`);
    }

    /**
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        console.log('🔗 AudioManager: 设置事件监听器...');
        
        // BGM控制事件
        eventBus.on(GameEvent.BGM_PLAY, (data) => {
            this.playBGM(data.key, data.loop, data.volume);
        });
        
        eventBus.on(GameEvent.BGM_STOP, () => {
            this.stopBGM();
        });
        
        eventBus.on(GameEvent.BGM_PAUSE, () => {
            this.pauseBGM();
        });
        
        eventBus.on(GameEvent.BGM_RESUME, () => {
            this.resumeBGM();
        });
        
        eventBus.on(GameEvent.BGM_VOLUME_CHANGE, (data) => {
            this.setBGMVolume(data.volume);
        });

        // SFX控制事件
        eventBus.on(GameEvent.SOUND_EFFECT_PLAY, (data) => {
            if (data.atlasKey && data.animationName) {
                this.playAnimationSound(data.atlasKey, data.animationName, data.volume);
            } else {
                this.playSFX(data.key, data.volume);
            }
        });
        
        eventBus.on(GameEvent.SOUND_EFFECT_STOP, (data) => {
            if (data.key) {
                this.stopSFX(data.key);
            } else {
                this.stopAllSFX();
            }
        });
        
        eventBus.on(GameEvent.SOUND_EFFECT_VOLUME_CHANGE, (data) => {
            this.setSFXVolume(data.volume);
        });

        // 场景变化事件
        eventBus.on(GameEvent.SCENE_CHANGE, (data) => {
            this.onSceneChange(data.to);
        });

        // 动画播放事件
        eventBus.on(GameEvent.ANIMATION_PLAY, (data) => {
            if (this.hasAnimationSound(data.atlasKey, data.animationName)) {
                this.playAnimationSound(data.atlasKey, data.animationName);
            }
        });

        // 游戏事件
        eventBus.on(GameEvent.PLAYER_JUMP, () => {
            this.playAnimationSound('main_player', 'jump');
        });
        
        eventBus.on(GameEvent.PLAYER_DAMAGE, () => {
            this.playAnimationSound('main_player', 'hit');
        });
        
        eventBus.on(GameEvent.ITEM_COLLECT, () => {
            this.playAnimationSound('main_player', 'collect');
        });
    }

    /**
     * 设置场景监听器
     */
    private setupSceneListener(): void {
        if (!this.game) return;

        this.game.events.on('step', () => {
            this.checkSceneChange();
        });
    }

    /**
     * 检查场景变化
     */
    private checkSceneChange(): void {
        if (!this.game || !this.config) return;

        const activeScenes = this.game.scene.getScenes(true);
        const primaryScene = activeScenes.find(scene => 
            ['MainMenu', 'Game', 'Victory', 'GameOver'].includes(scene.scene.key)
        );

        if (primaryScene && primaryScene.scene.key !== this.currentScene) {
            const previousScene = this.currentScene;
            this.currentScene = primaryScene.scene.key;
            this.scene = primaryScene;
            
            // 更新所有 AudioAssetLoader 的场景引用
            this.updateAllLoaderScenes(primaryScene);
            
            console.log(`🎬 AudioManager: 场景切换到 ${this.currentScene}`);
            
            if (previousScene) {
                eventBus.emit(GameEvent.SCENE_CHANGE, {
                    from: previousScene,
                    to: this.currentScene
                });
            } else {
                this.onSceneChange(this.currentScene);
            }
        }
    }

    /**
     * 更新所有加载器的场景引用
     */
    private updateAllLoaderScenes(scene: Phaser.Scene): void {
        this.audioLoaders.forEach(loader => {
            loader.setScene(scene);
        });
    }

    /**
     * 场景变化处理
     */
    private onSceneChange(sceneName: string): void {
        if (!this.config) return;

        const bgmKey = this.config.audioTypes.bgm.sceneMapping[sceneName];
        
        if (!bgmKey) {
            console.log(`🎬 AudioManager: 场景 "${sceneName}" 没有配置BGM，停止当前BGM`);
            this.stopBGM();
            return;
        }

        // 如果相同BGM正在播放，不重新开始
        const loader = this.audioLoaders.get(bgmKey);
        if (this.currentBGMKey === bgmKey && loader?.isPlaying()) {
            console.log(`🎵 AudioManager: 相同BGM正在播放，跳过 - ${bgmKey}`);
            return;
        }

        console.log(`🎬 AudioManager: 场景 "${sceneName}" 切换BGM到 "${bgmKey}"`);
        this.playBGM(bgmKey);
    }

    // ===== 音频解锁相关 =====

    /**
     * 设置用户交互监听器来自动解锁音频
     */
    private setupUserInteractionListeners(): void {
        if (this.audioUnlocked) return;

        const events = ['click', 'touchstart', 'keydown', 'pointerdown'];
        
        const unlockHandler = () => {
            console.log('🔓 AudioManager: 检测到用户交互，尝试解锁音频');
            this.unlockAudio();
        };

        // 添加事件监听器到document
        events.forEach(eventType => {
            const listener = () => unlockHandler();
            document.addEventListener(eventType, listener, { once: true, passive: true });
            this.userInteractionListeners.push(() => {
                document.removeEventListener(eventType, listener);
            });
        });

        console.log('🎧 AudioManager: 用户交互监听器已设置');
    }

    /**
     * 清理用户交互监听器
     */
    private cleanupUserInteractionListeners(): void {
        this.userInteractionListeners.forEach(cleanup => cleanup());
        this.userInteractionListeners = [];
    }

    /**
     * 解锁音频上下文（需要用户交互后调用）
     */
    public unlockAudio(): void {
        if (this.audioUnlocked) return;
        
        try {
            this.audioUnlocked = true;
            this.cleanupUserInteractionListeners();
            console.log('🔓 AudioManager: 音频已解锁');
        } catch (error: any) {
            console.error('❌ AudioManager: 解锁音频时出错:', error);
        }
    }

    // ===== 音频预加载相关 =====

    /**
     * 从配置中预加载音频资源 (供AudioConfigFile调用)
     */
    public async preloadFromConfig(_config: AudioConfig, audioType?: AudioType, scene?: Phaser.Scene): Promise<void> {
        const targetScene = scene || this.scene;
        if (!targetScene) {
            console.warn('⚠️ AudioManager: 没有可用的场景，无法预加载');
            return;
        }

        console.log(`🚀 AudioManager: 从配置预加载音频 (${audioType || '全部'}) - Scene: ${targetScene.scene.key}`);

        // 更新所有 AudioAssetLoader 的场景引用（重要！）
        this.updateAllLoaderScenes(targetScene);
        console.log(`✅ AudioManager: 已更新所有 AudioAssetLoader 的场景引用`);

        // 统计需要预加载的音频数量
        this.preloadTotal = 0;
        this.preloadLoaded = 0;

        let addedCount = 0;
        let skippedCount = 0;

        this.audioLoaders.forEach((loader) => {
            if (!loader.isPreload()) {
                skippedCount++;
                return;
            }
            
            // 如果指定了类型，只加载该类型
            if (audioType) {
                const loaderType = loader.getType() === AudioAssetType.BGM ? AudioType.BGM : AudioType.SFX;
                if (loaderType !== audioType) return;
            }

            this.preloadTotal++;
            
            // 注册加载完成回调用于进度更新
            loader.onLoadComplete(() => {
                this.preloadLoaded++;
                console.log(`📊 AudioManager: 预加载进度 ${this.preloadLoaded}/${this.preloadTotal}`);
            });

            // 添加到加载队列
            loader.addToLoadQueue();
            addedCount++;
        });

        console.log(`📊 AudioManager: 预加载统计 - 已添加: ${addedCount}, 跳过(非preload): ${skippedCount}, 总数: ${this.audioLoaders.size}`);

        if (addedCount === 0) {
            console.log('✅ AudioManager: 没有需要预加载的音频');
            return;
        }

        console.log(`🚀 AudioManager: 统一启动 loader.start()，加载 ${addedCount} 个音频文件`);
        targetScene.load.start();
    }

    /**
     * 处理已加载的音频（向后兼容）
     */
    public processLoadedAudio(): void {
        console.log('✅ AudioManager: processLoadedAudio 调用（使用新架构，无需额外处理）');
    }

    // ===== 后台加载相关 =====

    /**
     * 启动后台加载
     */
    public startBackgroundLoading(): void {
        if (!this.config) {
            console.warn('⚠️ AudioManager: 配置未加载，无法启动后台加载');
            return;
        }

        if (!this.scene) {
            console.warn('⚠️ AudioManager: 没有可用的场景，无法后台加载');
            return;
        }

        console.log('🔄 AudioManager: 开始后台加载音频...');

        // 重要：重置 loader 以便接受新文件
        // Phaser loader 在完成一次加载后进入 idle 状态，需要重置
        if (!this.scene.load.isReady()) {
            this.scene.load.reset();
        }

        let bgmCount = 0;
        let sfxCount = 0;
        let addedCount = 0;

        // 收集所有未预加载的音频并添加到队列
        this.audioLoaders.forEach((loader) => {
            if (loader.isPreload()) return; // 跳过已预加载的
            if (loader.isLoaded()) return;  // 跳过已加载的
            if (loader.isLoading()) return; // 跳过正在加载的

            if (loader.getType() === AudioAssetType.BGM) {
                bgmCount++;
            } else {
                sfxCount++;
            }

            // 添加到加载队列
            loader.addToLoadQueue();
            addedCount++;
        });

        if (addedCount === 0) {
            console.log('✅ AudioManager: 没有需要后台加载的音频');
            return;
        }

        console.log(`📦 AudioManager: 后台加载 ${addedCount} 个音频 (BGM: ${bgmCount}, SFX: ${sfxCount})`);
        
        // 统一启动加载
        this.scene.load.start();
    }

    // ===== BGM 播放控制 =====

    /**
     * 播放BGM
     */
    public playBGM(bgmKey: string, loop?: boolean, volume?: number): void {
        if (!this.config) {
            console.warn('⚠️ AudioManager: 无法播放BGM，配置未准备好');
            return;
        }

        const loader = this.audioLoaders.get(bgmKey);
        if (!loader) {
            console.warn(`⚠️ AudioManager: BGM "${bgmKey}" 不存在`);
            return;
        }

        // 检查音频是否已解锁
        if (!this.audioUnlocked) {
            console.log(`🔒 AudioManager: 音频未解锁，等待用户交互后自动播放 - ${bgmKey}`);
            return;
        }

        console.log(`🎵 AudioManager: 请求播放BGM - ${bgmKey} (状态: ${loader.getState()})`);

        // 取消之前BGM的加载完成回调
        if (this.currentBGMLoader && this.currentBGMLoader !== loader) {
            console.log(`🚫 AudioManager: 取消之前BGM的加载完成回调 - ${this.currentBGMKey}`);
            this.currentBGMLoader.clearLoadCompleteCallbacks();
            this.currentBGMLoader.stop();
        }

        // 更新当前BGM
        this.currentBGMKey = bgmKey;
        this.currentBGMLoader = loader;

        // 如果已加载，直接播放
        if (loader.isLoaded()) {
            const actualVolume = volume ?? this.config.assets.bgm[bgmKey]?.volume ?? this.config.audioTypes.bgm.defaultVolume;
            const actualLoop = loop ?? this.config.assets.bgm[bgmKey]?.loop ?? this.config.audioTypes.bgm.loop;
            
            loader.play(actualVolume, actualLoop);
            console.log(`✅ AudioManager: BGM播放成功 - ${bgmKey}`);
        } else {
            // 注册加载完成后播放
            console.log(`⏳ AudioManager: BGM未加载，注册加载完成后播放 - ${bgmKey}`);
            
            loader.onLoadComplete(() => {
                // 检查是否仍然是当前要播放的BGM
                if (this.currentBGMKey === bgmKey) {
                    const actualVolume = volume ?? this.config!.assets.bgm[bgmKey]?.volume ?? this.config!.audioTypes.bgm.defaultVolume;
                    const actualLoop = loop ?? this.config!.assets.bgm[bgmKey]?.loop ?? this.config!.audioTypes.bgm.loop;
                    
                    loader.play(actualVolume, actualLoop);
                    console.log(`✅ AudioManager: BGM加载完成后播放成功 - ${bgmKey}`);
                } else {
                    console.log(`⏭️ AudioManager: BGM已切换，取消播放 - ${bgmKey}`);
                }
            });

            // 如果还未开始加载，立即开始
            if (loader.isPending() && this.scene) {
                console.log(`📥 AudioManager: 立即开始加载BGM - ${bgmKey}`);
                // 确保 loader 处于可用状态
                if (!this.scene.load.isReady()) {
                    this.scene.load.reset();
                }
                loader.addToLoadQueue();
                this.scene.load.start();
            }
        }
    }

    /**
     * 停止BGM
     */
    public stopBGM(): void {
        if (!this.currentBGMLoader) {
            return;
        }

        console.log(`🛑 AudioManager: 停止BGM - ${this.currentBGMKey}`);
        this.currentBGMLoader.clearLoadCompleteCallbacks();
        this.currentBGMLoader.stop();
        
        this.currentBGMKey = null;
        this.currentBGMLoader = null;
    }

    /**
     * 暂停BGM
     */
    public pauseBGM(): void {
        if (!this.currentBGMLoader) return;
        
        this.currentBGMLoader.pause();
        console.log(`⏸️ AudioManager: 暂停BGM - ${this.currentBGMKey}`);
    }

    /**
     * 恢复BGM
     */
    public resumeBGM(): void {
        if (!this.currentBGMLoader) return;
        
        this.currentBGMLoader.resume();
        console.log(`▶️ AudioManager: 恢复BGM - ${this.currentBGMKey}`);
    }

    /**
     * 设置BGM音量
     */
    public setBGMVolume(volume: number): void {
        if (!this.currentBGMLoader) return;
        
        const clampedVolume = Math.max(0, Math.min(1, volume));
        this.currentBGMLoader.setVolume(clampedVolume);
        console.log(`🔊 AudioManager: 设置BGM音量 - ${clampedVolume}`);
    }

    // ===== SFX 播放控制 =====

    /**
     * 播放音效
     */
    public playSFX(sfxKey: string, volume?: number): void {
        if (!this.config) {
            console.warn('⚠️ AudioManager: 无法播放SFX，配置未准备好');
            return;
        }

        const loader = this.audioLoaders.get(sfxKey);
        if (!loader) {
            console.warn(`⚠️ AudioManager: SFX "${sfxKey}" 不存在`);
            return;
        }

        // 如果已加载，直接播放
        if (loader.isLoaded()) {
            const actualVolume = volume ?? this.config.assets.sfx[sfxKey]?.volume ?? this.config.audioTypes.sfx.defaultVolume;
            loader.play(actualVolume, false);
        } else {
            // 未加载，静默跳过
            console.log(`⏭️ AudioManager: SFX未加载，跳过播放 - ${sfxKey} (状态: ${loader.getState()})`);
            
            // 如果还未开始加载，加入后台加载队列
            if (loader.isPending() && this.scene) {
                console.log(`➕ AudioManager: 将SFX加入后台加载 - ${sfxKey}`);
                // 确保 loader 处于可用状态
                if (!this.scene.load.isReady()) {
                    this.scene.load.reset();
                }
                loader.addToLoadQueue();
                this.scene.load.start();
            }
        }
    }

    /**
     * 播放动画音效
     */
    public playAnimationSound(atlasKey: string, animationName: string, volume?: number): void {
        const animKey = `${atlasKey}_${animationName}`;
        console.log(`🎭 AudioManager: 尝试播放动画音效 - ${animKey}`);
        
        let soundKeys = this.animationToSounds.get(animKey);
        
        // 尝试回退音效
        if (!soundKeys || soundKeys.length === 0) {
            if (animationName === 'die') {
                const fallbackKey = `${atlasKey}_hit`;
                soundKeys = this.animationToSounds.get(fallbackKey);
                if (soundKeys && soundKeys.length > 0) {
                    console.log(`🔄 AudioManager: 使用回退音效 'hit' 代替 'die'`);
                }
            }
            
            if (!soundKeys || soundKeys.length === 0) {
                console.log(`⚠️ AudioManager: 没有找到动画音效映射 - ${animKey}`);
                return;
            }
        }
        
        // 随机选择一个音效
        const randomIndex = Math.floor(Math.random() * soundKeys.length);
        const selectedSoundKey = soundKeys[randomIndex];
        console.log(`🎲 AudioManager: 选择音效 ${randomIndex + 1}/${soundKeys.length} - ${selectedSoundKey}`);
        
        this.playSFX(selectedSoundKey, volume);
    }

    /**
     * 检查是否有动画音效
     */
    public hasAnimationSound(atlasKey: string, animationName: string): boolean {
        const animKey = `${atlasKey}_${animationName}`;
        const sounds = this.animationToSounds.get(animKey);
        return sounds !== undefined && sounds.length > 0;
    }

    /**
     * 停止SFX
     */
    public stopSFX(sfxKey: string): void {
        const loader = this.audioLoaders.get(sfxKey);
        if (loader) {
            loader.stop();
            console.log(`🛑 AudioManager: 停止SFX - ${sfxKey}`);
        }
    }

    /**
     * 停止所有SFX
     */
    public stopAllSFX(): void {
        let stoppedCount = 0;
        
        this.audioLoaders.forEach((loader) => {
            if (loader.getType() === AudioAssetType.SFX && loader.isPlaying()) {
                loader.stop();
                stoppedCount++;
            }
        });
        
        console.log(`🛑 AudioManager: 停止了 ${stoppedCount} 个SFX`);
    }

    /**
     * 设置SFX音量
     */
    public setSFXVolume(volume: number): void {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        let updatedCount = 0;
        
        this.audioLoaders.forEach((loader) => {
            if (loader.getType() === AudioAssetType.SFX) {
                loader.setVolume(clampedVolume);
                updatedCount++;
            }
        });
        
        console.log(`🔊 AudioManager: 设置 ${updatedCount} 个SFX音量 - ${clampedVolume}`);
    }

    // ===== 清理和 Getter 方法 =====

    /**
     * 清理资源
     */
    public destroy(): void {
        console.log('🧹 AudioManager: 开始清理资源...');
        
        this.stopBGM();
        this.stopAllSFX();
        
        this.audioLoaders.forEach(loader => {
            loader.destroy();
        });
        
        this.audioLoaders.clear();
        this.animationToSounds.clear();
        
        if (this.game) {
            this.game.events.off('step');
        }
        
        this.scene = null;
        this.game = null;
        this.config = null;
        this.isInitialized = false;
        this.configLoaded = false;
        
        console.log('✅ AudioManager: 资源清理完成');
    }

    public getCurrentBGM(): string | null {
        return this.currentBGMKey;
    }

    public getCurrentScene(): string | null {
        return this.currentScene;
    }

    public getLoadedSounds(): string[] {
        const loaded: string[] = [];
        this.audioLoaders.forEach((loader, key) => {
            if (loader.isLoaded()) {
                loaded.push(key);
            }
        });
        return loaded;
    }

    public getConfig(): AudioConfig | null {
        return this.config;
    }

    public isReady(): boolean {
        return this.isInitialized && this.configLoaded;
    }

    /**
     * 获取预加载进度（用于进度条）
     */
    public getPreloadProgress(): { loaded: number; total: number; progress: number } {
        const progress = this.preloadTotal > 0 ? this.preloadLoaded / this.preloadTotal : 1;
        return {
            loaded: this.preloadLoaded,
            total: this.preloadTotal,
            progress
        };
    }
}
