import { eventBus, GameEvent } from '../events/EventBus';
import { GlobalResourceManager } from '../resourceManager/GlobalResourceManager';
import { AudioLoader } from '../resourceManager/utils/AudioLoader';

// 音频类型枚举
export enum AudioType {
    BGM = 'bgm',
    SFX = 'sfx'
}

// 加载策略枚举
export enum LoadStrategy {
    PRELOAD_ALL = 'preload_all',
    LAZY_LOAD = 'lazy_load',
    SCENE_BASED = 'scene_based'
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
    loadStrategy: LoadStrategy;
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
    
    // 音频缓存
    private loadedSounds: Map<string, Phaser.Sound.BaseSound> = new Map();
    private loadedAssets: Set<string> = new Set();
    
    // BGM相关
    private currentBGM: string | null = null;
    private currentBGMSound: Phaser.Sound.BaseSound | null = null;
    private currentScene: string | null = null;
    
    // SFX相关
    private animationToSounds: Map<string, string[]> = new Map();
    
    // 状态
    private isInitialized: boolean = false;
    private configLoaded: boolean = false;
    private audioUnlocked: boolean = false;
    private userInteractionListeners: (() => void)[] = [];

    private constructor() {}

    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

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
            // 尝试恢复音频上下文
            const soundManager = this.scene?.sound;
            if (soundManager && 'context' in soundManager) {
                const audioContext = (soundManager as any).context as AudioContext;
                if (audioContext && audioContext.state === 'suspended') {
                    audioContext.resume().then(() => {
                        console.log('🔓 AudioManager: 音频上下文已解锁');
                        this.audioUnlocked = true;
                        this.cleanupUserInteractionListeners();
                        // 如果有待播放的BGM，现在开始播放
                        if (this.currentScene && this.config) {
                            console.log(`🎬 AudioManager: 解锁音频，尝试播放 ${this.currentScene}`);
                            this.onSceneChange(this.currentScene);
                        }
                    }).catch((error: any) => {
                        console.error('❌ AudioManager: 音频上下文解锁失败:', error);
                    });
                } else {
                    this.audioUnlocked = true;
                    this.cleanupUserInteractionListeners();
                    console.log('🔓 AudioManager: 音频上下文已经是活跃状态');
                }
            } else {
                this.audioUnlocked = true;
                this.cleanupUserInteractionListeners();
                console.log('🔓 AudioManager: 音频上下文不存在，标记为已解锁');
            }
        } catch (error: any) {
            console.error('❌ AudioManager: 解锁音频时出错:', error);
        }
    }

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
        this.buildAnimationSoundMap();
        console.log('✅ AudioManager: 配置设置成功');
    }

    /**
     * 加载音频配置
     */
    private async loadConfig(configPath: string = '/assets/audio/audio-config.json'): Promise<void> {
        try {
            console.log('📋 AudioManager: 加载配置文件...');
            const response = await fetch(configPath);
            if (!response.ok) {
                throw new Error(`Failed to load audio config: ${response.statusText}`);
            }
            
            this.config = await response.json();
            this.configLoaded = true;
            
            console.log('✅ AudioManager: 配置加载成功');
            this.buildAnimationSoundMap();
            
        } catch (error) {
            console.error('❌ AudioManager: 配置加载失败:', error);
            // 使用默认配置
            this.config = this.getDefaultConfig();
            this.configLoaded = true;
        }
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
                    console.log(`🎭 AudioManager: 映射 ${animKey} -> ${soundKeys.length} 个音效`);
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
        this.setupGameEventListeners();
    }

    /**
     * 设置游戏事件监听器
     */
    private setupGameEventListeners(): void {
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
     * 从配置中预加载音频资源 (供AudioConfigFile调用)
     */
    public async preloadFromConfig(config: AudioConfig, audioType?: AudioType, scene?: Phaser.Scene): Promise<void> {
        const targetScene = scene || this.scene;
        if (!targetScene) {
            console.warn('⚠️ AudioManager: 没有可用的场景，无法预加载');
            return;
        }

        console.log(`🚀 AudioManager: 从配置预加载音频 (${audioType || '全部'})`);

        const assetsToLoad: Array<{ key: string; url: string; type: AudioType }> = [];

        // 收集需要预加载的资源
        if (!audioType || audioType === AudioType.BGM) {
            for (const [key, asset] of Object.entries(config.assets.bgm)) {
                if (asset.preload && !this.loadedAssets.has(key) && !targetScene.cache.audio.exists(key)) {
                    assetsToLoad.push({ key, url: asset.url, type: AudioType.BGM });
                }
            }
        }

        if (!audioType || audioType === AudioType.SFX) {
            for (const [key, asset] of Object.entries(config.assets.sfx)) {
                if (asset.preload && !this.loadedAssets.has(key) && !targetScene.cache.audio.exists(key)) {
                    assetsToLoad.push({ key, url: asset.url, type: AudioType.SFX });
                }
            }
        }

        if (assetsToLoad.length === 0) {
            console.log('✅ AudioManager: 所有音频已加载，跳过预加载');
            return;
        }

        return this.loadAudioAssets(assetsToLoad, targetScene);
    }

    /**
     * 加载音频资源列表的通用方法
     */
    private async loadAudioAssets(assetsToLoad: Array<{ key: string; url: string; type: AudioType }>, scene: Phaser.Scene): Promise<void> {
        return new Promise<void>((resolve) => {
            // 添加到加载队列
            assetsToLoad.forEach(({ key, url }) => {
                console.log(`📦 AudioManager: 添加到加载队列 - ${key}`);
                const resourceManager = GlobalResourceManager.getInstance();
                const actualUrl = resourceManager.getResourcePath(url);
                if (actualUrl) {
                    AudioLoader.loadMultiFormat(scene.load, key, actualUrl);
                } else {
                    console.error(`❌ AudioManager: 无法解析资源路径: ${url}`);
                }
            });

            // 监听加载错误事件
            scene.load.on('loaderror', (file: any) => {
                console.error(`🚨 AudioManager: 加载错误 - ${file.key}`, file.src);
            });

            // 设置加载完成事件
            scene.load.once('complete', () => {
                let successCount = 0;
                let errorCount = 0;

                assetsToLoad.forEach(({ key, url, type }) => {
                    if (scene.cache.audio.exists(key)) {
                        this.loadedAssets.add(key);
                        successCount++;
                        console.log(`✅ AudioManager: ${type.toUpperCase()} 加载成功 - ${key}`);

                        // 处理待处理的别名
                        AudioLoader.processPendingAliases(key, scene);
                    } else {
                        errorCount++;
                        const resourceManager = GlobalResourceManager.getInstance();
                        const actualUrl = resourceManager.getResourcePath(url);
                        console.error(`❌ AudioManager: ${type.toUpperCase()} 加载失败 - ${key}`);
                        console.error(`   配置URL: ${url}`);
                        console.error(`   实际URL: ${actualUrl || '无法解析'}`);
                    }
                });

                console.log(`🎉 AudioManager: 预加载完成 - 成功: ${successCount}, 失败: ${errorCount}`);
                resolve();
            });

            // 开始加载
            scene.load.start();
        });
    }

    /**
     * 处理已加载的音频
     */
    public processLoadedAudio(): void {
        if (!this.config || !this.scene) return;
        
        console.log('🔄 AudioManager: 处理已加载的音频...');
        let processedCount = 0;
        
        // 处理所有已加载的音频资源
        const allAssets = { ...this.config.assets.bgm, ...this.config.assets.sfx };
        
        for (const [key, asset] of Object.entries(allAssets)) {
            if (this.scene.cache.audio.exists(key) && !this.loadedSounds.has(key)) {
                try {
                    const sound = this.scene.sound.add(key, {
                        volume: asset.volume || 0.5,
                        loop: asset.loop || false
                    });
                    this.loadedSounds.set(key, sound);
                    processedCount++;
                    console.log(`🎵 AudioManager: 创建音频对象 - ${key}`);
                } catch (error) {
                    console.error(`❌ AudioManager: 创建音频对象失败 - ${key}:`, error);
                }
            }
        }
        
        console.log(`✅ AudioManager: 处理完成，创建了 ${processedCount} 个音频对象`);
    }

    // ===== BGM 相关方法 =====

    /**
     * 播放BGM
     */
    public async playBGM(bgmKey: string, loop?: boolean, volume?: number): Promise<void> {
        if (!this.config || !this.scene) {
            console.warn('⚠️ AudioManager: 无法播放BGM，配置或场景未准备好');
            return;
        }

        // 检查音频是否已解锁
        if (!this.audioUnlocked) {
            console.log(`🔒 AudioManager: 音频未解锁，等待用户交互后播放BGM - ${bgmKey}`);
            return;
        }

        const asset = this.config.assets.bgm[bgmKey];
        if (!asset) {
            console.warn(`⚠️ AudioManager: BGM "${bgmKey}" 不存在于配置中`);
            return;
        }

        console.log(`🎵 AudioManager: 播放BGM - ${bgmKey}`);

        try {
            // 如果音频已加载，直接播放
            if (this.loadedSounds.has(bgmKey)) {
                this.playBGMInstance(bgmKey, loop, volume);
            } else {
                // 动态加载并播放
                await this.loadAudio(bgmKey, asset.url, AudioType.BGM);
                this.playBGMInstance(bgmKey, loop, volume);
            }
        } catch (error) {
            console.error(`❌ AudioManager: BGM播放失败 "${bgmKey}":`, error);
        }
    }

    /**
     * 播放BGM实例
     */
    private playBGMInstance(bgmKey: string, loop?: boolean, volume?: number): void {
        if (!this.config) return;

        // 停止当前BGM
        this.stopBGM();

        const asset = this.config.assets.bgm[bgmKey];

        // 处理别名，获取实际的音频key
        const actualKey = AudioLoader.getActualKey(bgmKey);
        const sound = this.loadedSounds.get(actualKey);
        
        if (!sound) {
            console.error(`❌ AudioManager: BGM音频对象不存在 - ${bgmKey} (实际key: ${actualKey})`);
            return;
        }

        try {
            // 设置音频属性
            if ('setLoop' in sound) {
                (sound as any).setLoop(loop ?? asset.loop ?? true);
            }
            if ('setVolume' in sound) {
                (sound as any).setVolume(volume ?? asset.volume ?? this.config.audioTypes.bgm.defaultVolume);
            }

            sound.play();
            this.currentBGM = bgmKey;
            this.currentBGMSound = sound;
            
            console.log(`✅ AudioManager: BGM播放成功 - ${bgmKey}`);
        } catch (error) {
            console.error(`❌ AudioManager: BGM播放实例失败 - ${bgmKey}:`, error);
        }
    }

    /**
     * 停止BGM
     */
    public stopBGM(): void {
        if (this.currentBGMSound) {
            try {
                this.currentBGMSound.stop();
                console.log(`🛑 AudioManager: 停止BGM - ${this.currentBGM}`);
            } catch (error) {
                console.error(`❌ AudioManager: 停止BGM失败:`, error);
            }
            this.currentBGMSound = null;
            this.currentBGM = null;
        }
    }

    /**
     * 暂停BGM
     */
    public pauseBGM(): void {
        if (this.currentBGMSound && this.currentBGMSound.isPlaying) {
            this.currentBGMSound.pause();
            console.log(`⏸️ AudioManager: 暂停BGM - ${this.currentBGM}`);
        }
    }

    /**
     * 恢复BGM
     */
    public resumeBGM(): void {
        if (this.currentBGMSound && !this.currentBGMSound.isPlaying) {
            this.currentBGMSound.resume();
            console.log(`▶️ AudioManager: 恢复BGM - ${this.currentBGM}`);
        }
    }

    /**
     * 设置BGM音量
     */
    public setBGMVolume(volume: number): void {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        if (this.currentBGMSound && 'setVolume' in this.currentBGMSound) {
            (this.currentBGMSound as any).setVolume(clampedVolume);
            console.log(`🔊 AudioManager: 设置BGM音量 - ${clampedVolume}`);
        }
    }

    // ===== SFX 相关方法 =====

    /**
     * 播放音效
     */
    public async playSFX(sfxKey: string, volume?: number): Promise<void> {
        if (!this.config || !this.scene) {
            console.warn('⚠️ AudioManager: 无法播放SFX，配置或场景未准备好');
            return;
        }

        const asset = this.config.assets.sfx[sfxKey];
        if (!asset) {
            console.warn(`⚠️ AudioManager: SFX "${sfxKey}" 不存在于配置中`);
            return;
        }

        try {
            // 如果音频已加载，直接播放
            if (this.loadedSounds.has(sfxKey)) {
                this.playSFXInstance(sfxKey, volume);
            } else {
                // 动态加载并播放
                await this.loadAudio(sfxKey, asset.url, AudioType.SFX);
                this.playSFXInstance(sfxKey, volume);
            }
        } catch (error) {
            console.error(`❌ AudioManager: SFX播放失败 "${sfxKey}":`, error);
        }
    }

    /**
     * 播放SFX实例
     */
    private playSFXInstance(sfxKey: string, volume?: number): void {
        if (!this.config) return;

        const asset = this.config.assets.sfx[sfxKey];

        // 处理别名，获取实际的音频key
        const actualKey = AudioLoader.getActualKey(sfxKey);
        let sound = this.loadedSounds.get(actualKey);
        
        if (!sound) {
            // 尝试从缓存创建（检查实际key和别名key）
            const cacheKey = this.scene?.cache.audio.exists(actualKey) ? actualKey :
                            this.scene?.cache.audio.exists(sfxKey) ? sfxKey : null;

            if (cacheKey && this.scene) {
                try {
                    sound = this.scene.sound.add(cacheKey, {
                        volume: volume ?? asset.volume ?? this.config.audioTypes.sfx.defaultVolume,
                        loop: false
                    });
                    this.loadedSounds.set(actualKey, sound);
                    console.log(`🎵 AudioManager: 创建SFX音频对象 - ${sfxKey} (实际key: ${actualKey})`);
                } catch (error) {
                    console.error(`❌ AudioManager: 创建SFX音频对象失败 - ${sfxKey}:`, error);
                    return;
                }
            } else {
                console.error(`❌ AudioManager: SFX音频对象不存在 - ${sfxKey} (实际key: ${actualKey})`);
                return;
            }
        }

        try {
            // 设置音量
            if ('setVolume' in sound) {
                (sound as any).setVolume(volume ?? asset.volume ?? this.config.audioTypes.sfx.defaultVolume);
            }

            if (!sound.isPlaying) {
                sound.play();
                console.log(`🔊 AudioManager: SFX播放成功 - ${sfxKey}`);
            }
        } catch (error) {
            console.error(`❌ AudioManager: SFX播放实例失败 - ${sfxKey}:`, error);
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
     * 停止SFX
     */
    public stopSFX(sfxKey: string): void {
        const sound = this.loadedSounds.get(sfxKey);
        if (sound && sound.isPlaying) {
            sound.stop();
            console.log(`🛑 AudioManager: 停止SFX - ${sfxKey}`);
        }
    }

    /**
     * 停止所有SFX
     */
    public stopAllSFX(): void {
        let stoppedCount = 0;
        this.loadedSounds.forEach((sound, key) => {
            if (sound.isPlaying && key !== this.currentBGM) {
                sound.stop();
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
        
        this.loadedSounds.forEach((sound, key) => {
            if (key !== this.currentBGM && 'setVolume' in sound) {
                (sound as any).setVolume(clampedVolume);
                updatedCount++;
            }
        });
        
        console.log(`🔊 AudioManager: 设置 ${updatedCount} 个SFX音量 - ${clampedVolume}`);
    }

    // ===== 工具方法 =====

    /**
     * 动态加载音频
     */
    private async loadAudio(key: string, url: string, type: AudioType): Promise<void> {
        if (!this.scene || this.loadedAssets.has(key)) {
            return;
        }

        if (this.scene.cache.audio.exists(key)) {
            this.loadedAssets.add(key);
            return;
        }

        // 通过GlobalResourceManager解析实际的音频文件路径
        const resourceManager = GlobalResourceManager.getInstance();
        const actualUrl = resourceManager.getResourcePath(url);
        
        if (!actualUrl) {
            console.error(`❌ AudioManager: 无法解析音频资源路径: ${url}`);
            throw new Error(`Cannot resolve audio resource path: ${url}`);
        }

        console.log(`🎵 AudioManager: 动态加载音频 ${key} (${url} -> ${actualUrl})`);

        try {
            await new Promise<void>((resolve, reject) => {
                AudioLoader.loadMultiFormat(this.scene!.load, key, actualUrl);
                
                this.scene!.load.once('complete', () => {
                    if (this.scene!.cache.audio.exists(key)) {
                        this.loadedAssets.add(key);
                        
                        // 创建音频对象
                        const asset = type === AudioType.BGM ? 
                            this.config?.assets.bgm[key] : 
                            this.config?.assets.sfx[key];
                            
                        if (asset) {
                            const sound = this.scene!.sound.add(key, {
                                volume: asset.volume || 0.5,
                                loop: asset.loop || false
                            });
                            this.loadedSounds.set(key, sound);
                        }
                        
                        console.log(`✅ AudioManager: 动态加载成功 - ${type.toUpperCase()}: ${key}`);
                        resolve();
                    } else {
                        reject(new Error(`Failed to load audio "${key}"`));
                    }
                });

                this.scene!.load.once('loaderror', () => {
                    reject(new Error(`Failed to load audio "${key}" from "${actualUrl}" (resolved from "${url}")`));
                });

                this.scene!.load.start();
            });
        } catch (error) {
            console.error(`❌ AudioManager: 动态加载失败 "${key}":`, error);
            throw error;
        }
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
        if (this.currentBGM === bgmKey && this.currentBGMSound?.isPlaying) {
            console.log(`🎵 AudioManager: 相同BGM正在播放，跳过 - ${bgmKey}`);
            return;
        }

        console.log(`🎬 AudioManager: 场景 "${sceneName}" 切换BGM到 "${bgmKey}"`);
        this.playBGM(bgmKey);
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
     * 获取默认配置
     */
    private getDefaultConfig(): AudioConfig {
        return {
            loadStrategy: LoadStrategy.PRELOAD_ALL,
            audioTypes: {
                bgm: {
                    defaultVolume: 0.7,
                    loop: true,
                    sceneMapping: {}
                },
                sfx: {
                    defaultVolume: 0.5,
                    loop: false,
                    animationMapping: {}
                }
            },
            assets: {
                bgm: {},
                sfx: {}
            }
        };
    }

    /**
     * 清理资源
     */
    public destroy(): void {
        console.log('🧹 AudioManager: 开始清理资源...');
        
        this.stopBGM();
        this.stopAllSFX();
        
        this.loadedSounds.forEach(sound => {
            try {
                sound.destroy();
            } catch (error) {
                console.error('❌ AudioManager: 销毁音频对象失败:', error);
            }
        });
        
        this.loadedSounds.clear();
        this.loadedAssets.clear();
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

    // ===== Getter 方法 =====

    public getCurrentBGM(): string | null {
        return this.currentBGM;
    }

    public getCurrentScene(): string | null {
        return this.currentScene;
    }

    public getLoadedSounds(): string[] {
        return Array.from(this.loadedSounds.keys());
    }

    public getConfig(): AudioConfig | null {
        return this.config;
    }

    public isReady(): boolean {
        return this.isInitialized && this.configLoaded;
    }
}
