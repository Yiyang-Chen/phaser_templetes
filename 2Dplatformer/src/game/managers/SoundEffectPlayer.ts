import { eventBus, GameEvent } from '../events/EventBus';

export interface SoundEffect {
    key: string;
    uri: string;
}

export interface SoundEffectConfig {
    [atlasKey: string]: {
        [animationName: string]: SoundEffect[];
    };
}

export class SoundEffectPlayer {
    private static instance: SoundEffectPlayer;
    private scene: Phaser.Scene;
    private soundEffectConfig: SoundEffectConfig = {};
    private loadedSounds: Map<string, Phaser.Sound.BaseSound> = new Map();
    private animationToSounds: Map<string, SoundEffect[]> = new Map();
    private configLoaded: boolean = false;
    
    private constructor() {}
    
    static getInstance(): SoundEffectPlayer {
        if (!SoundEffectPlayer.instance) {
            SoundEffectPlayer.instance = new SoundEffectPlayer();
        }
        return SoundEffectPlayer.instance;
    }
    
    init(scene: Phaser.Scene): void {
        // console.log('[SoundEffectPlayer] Initializing with scene:', scene.scene.key);
        this.scene = scene;
        this.soundEffectConfig = {};
        this.loadedSounds.clear();
        this.animationToSounds.clear();
        this.configLoaded = false;
        this.setupEventListeners();
        // console.log('[SoundEffectPlayer] Initialization complete');
    }
    
    private setupEventListeners(): void {
        // Listen for sound effect play events
        eventBus.on(GameEvent.SOUND_EFFECT_PLAY, (data) => {
            if (data.atlasKey && data.animationName) {
                this.playAnimationSound(data.atlasKey, data.animationName, data.volume ?? 0.5);
            } else {
                this.playSound(data.key, data.volume ?? 0.5);
            }
        });
        
        // Listen for sound effect stop events
        eventBus.on(GameEvent.SOUND_EFFECT_STOP, (data) => {
            if (data.key) {
                this.stopSound(data.key);
            } else {
                this.stopAllSounds();
            }
        });
        
        // Listen for volume change events
        eventBus.on(GameEvent.SOUND_EFFECT_VOLUME_CHANGE, (data) => {
            this.setGlobalVolume(data.volume);
        });
        
        // Listen for animation play events to automatically play sounds
        eventBus.on(GameEvent.ANIMATION_PLAY, (data) => {
            if (this.hasAnimationSound(data.atlasKey, data.animationName)) {
                this.playAnimationSound(data.atlasKey, data.animationName);
            }
        });
        
        // Listen for player action events
        eventBus.on(GameEvent.PLAYER_JUMP, () => {
            // Emit sound effect event for jump
            eventBus.emit(GameEvent.SOUND_EFFECT_PLAY, {
                key: 'jump',
                volume: 0.5
            });
        });
        
        eventBus.on(GameEvent.PLAYER_DOUBLE_JUMP, () => {
            eventBus.emit(GameEvent.SOUND_EFFECT_PLAY, {
                key: 'double_jump',
                volume: 0.5
            });
        });
        
        eventBus.on(GameEvent.PLAYER_WALL_JUMP, () => {
            eventBus.emit(GameEvent.SOUND_EFFECT_PLAY, {
                key: 'wall_jump',
                volume: 0.5
            });
        });
        
        eventBus.on(GameEvent.PLAYER_DAMAGE, () => {
            eventBus.emit(GameEvent.SOUND_EFFECT_PLAY, {
                key: 'damage',
                volume: 0.7
            });
        });
        
        eventBus.on(GameEvent.ITEM_COLLECT, () => {
            eventBus.emit(GameEvent.SOUND_EFFECT_PLAY, {
                key: 'collect',
                volume: 0.6
            });
        });
    }
    
    async loadConfig(configPath: string = 'assets/audio/sound_effect/config.json'): Promise<void> {
        // console.log('[SoundEffectPlayer] Loading config from:', configPath);
        try {
            const response = await fetch(configPath);
            if (!response.ok) {
                // console.warn(`[SoundEffectPlayer] Config not found at ${configPath}`);
                return;
            }
            
            this.soundEffectConfig = await response.json();
            this.configLoaded = true;
            
            // console.log('[SoundEffectPlayer] Config loaded successfully');
            // console.log('[SoundEffectPlayer] Atlas keys:', Object.keys(this.soundEffectConfig));
            
            this.buildAnimationSoundMap();
            
            // console.log('[SoundEffectPlayer] Full config:', this.soundEffectConfig);
        } catch (error) {
            // console.error('[SoundEffectPlayer] Error loading config:', error);
        }
    }
    
    private buildAnimationSoundMap(): void {
        // console.log('[SoundEffectPlayer] Building animation-sound map...');
        let mappingCount = 0;
        
        for (const [atlasKey, animations] of Object.entries(this.soundEffectConfig)) {
            for (const [animationName, sounds] of Object.entries(animations)) {
                const animKey = `${atlasKey}_${animationName}`;
                this.animationToSounds.set(animKey, sounds);
                if (sounds.length > 0) {
                    console.log(`[SoundEffectPlayer] Mapped ${animKey} -> ${sounds.length} sound(s)`);
                    mappingCount++;
                }
            }
        }
        
        // console.log(`[SoundEffectPlayer] Built ${mappingCount} animation-sound mappings`);
    }
    
    preloadSounds(): void {
        if (!this.configLoaded) {
            // console.warn('[SoundEffectPlayer] Cannot preload - config not loaded yet');
            return;
        }
        
        // console.log('[SoundEffectPlayer] Starting sound preload...');
        const allSounds = new Set<SoundEffect>();
        
        for (const animations of Object.values(this.soundEffectConfig)) {
            for (const sounds of Object.values(animations)) {
                sounds.forEach(sound => allSounds.add(sound));
            }
        }
        
        let loadedCount = 0;
        let skippedCount = 0;
        
        allSounds.forEach(sound => {
            if (!this.scene.cache.audio.exists(sound.key)) {
                // console.log(`[SoundEffectPlayer] Loading: ${sound.key} from ${sound.uri}`);
                this.scene.load.audio(sound.key, sound.uri);
                loadedCount++;
            } else {
                // console.log(`[SoundEffectPlayer] Already cached: ${sound.key}`);
                skippedCount++;
            }
        });
        
        // console.log(`[SoundEffectPlayer] Preload complete - Loaded: ${loadedCount}, Skipped: ${skippedCount}, Total: ${allSounds.size}`);
    }
    
    onSoundsLoaded(): void {
        // console.log('[SoundEffectPlayer] Processing loaded sounds...');
        let successCount = 0;
        let errorCount = 0;
        
        for (const [animKey, sounds] of this.animationToSounds) {
            sounds.forEach(sound => {
                if (this.scene.cache.audio.exists(sound.key) && !this.loadedSounds.has(sound.key)) {
                    try {
                        const audioSound = this.scene.sound.add(sound.key, {
                            volume: 0.5,
                            loop: false
                        });
                        this.loadedSounds.set(sound.key, audioSound);
                        // console.log(`[SoundEffectPlayer] Created sound object: ${sound.key} for ${animKey}`);
                        successCount++;
                    } catch (error) {
                        // console.error(`[SoundEffectPlayer] Error creating sound ${sound.key}:`, error);
                        errorCount++;
                    }
                }
            });
        }
        
        // console.log(`[SoundEffectPlayer] Sound processing complete - Success: ${successCount}, Errors: ${errorCount}, Total loaded: ${this.loadedSounds.size}`);
    }
    
    playAnimationSound(atlasKey: string, animationName: string, volume: number = 0.5): void {
        const animKey = `${atlasKey}_${animationName}`;
        // console.log(`[SoundEffectPlayer] Attempting to play sound for animation: ${animKey}`);
        
        let sounds = this.animationToSounds.get(animKey);
        
        // Try fallback sounds if primary sound doesn't exist
        if (!sounds || sounds.length === 0) {
            // For 'die' sound, try 'hit' as fallback
            if (animationName === 'die') {
                const fallbackKey = `${atlasKey}_hit`;
                sounds = this.animationToSounds.get(fallbackKey);
                if (sounds && sounds.length > 0) {
                    // console.log(`[SoundEffectPlayer] Using fallback sound 'hit' for 'die' animation`);
                }
            }
            
            if (!sounds || sounds.length === 0) {
                // console.log(`[SoundEffectPlayer] No sounds mapped for animation: ${animKey}`);
                return;
            }
        }
        
        const randomIndex = Math.floor(Math.random() * sounds.length);
        const randomSound = sounds[randomIndex];
        // console.log(`[SoundEffectPlayer] Selected sound ${randomIndex + 1}/${sounds.length}: ${randomSound.key}`);
        
        this.playSound(randomSound.key, volume);
    }
    
    playSound(soundKey: string, volume: number = 0.5): void {
        // console.log(`[SoundEffectPlayer] Playing sound: ${soundKey} at volume: ${volume}`);
        const sound = this.loadedSounds.get(soundKey);
        
        if (!sound) {
            // console.log(`[SoundEffectPlayer] Sound not in cache, attempting to create: ${soundKey}`);
            if (this.scene.cache.audio.exists(soundKey)) {
                try {
                    const newSound = this.scene.sound.add(soundKey, {
                        volume: volume,
                        loop: false
                    });
                    this.loadedSounds.set(soundKey, newSound);
                    newSound.play();
                    // console.log(`[SoundEffectPlayer] Created and played new sound: ${soundKey}`);
                } catch (error) {
                    // console.error(`[SoundEffectPlayer] Error playing sound ${soundKey}:`, error);
                }
            } else {
                // console.warn(`[SoundEffectPlayer] Sound not found in audio cache: ${soundKey}`);
            }
            return;
        }
        
        if ('volume' in sound) {
            (sound as any).volume = volume;
        }
        
        if (!sound.isPlaying) {
            sound.play();
            // console.log(`[SoundEffectPlayer] Successfully played sound: ${soundKey}`);
        } else {
            // console.log(`[SoundEffectPlayer] Sound already playing: ${soundKey}`);
        }
    }
    
    stopSound(soundKey: string): void {
        const sound = this.loadedSounds.get(soundKey);
        if (sound && sound.isPlaying) {
            sound.stop();
        }
    }
    
    stopAllSounds(): void {
        this.loadedSounds.forEach(sound => {
            if (sound.isPlaying) {
                sound.stop();
            }
        });
    }
    
    setVolume(soundKey: string, volume: number): void {
        const sound = this.loadedSounds.get(soundKey);
        if (sound && 'volume' in sound) {
            (sound as any).volume = Math.max(0, Math.min(1, volume));
        }
    }
    
    setGlobalVolume(volume: number): void {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        this.loadedSounds.forEach(sound => {
            if ('volume' in sound) {
                (sound as any).volume = clampedVolume;
            }
        });
    }
    
    hasAnimationSound(atlasKey: string, animationName: string): boolean {
        const animKey = `${atlasKey}_${animationName}`;
        const sounds = this.animationToSounds.get(animKey);
        return sounds !== undefined && sounds.length > 0;
    }
    
    clear(): void {
        this.stopAllSounds();
        
        this.loadedSounds.forEach(sound => {
            sound.destroy();
        });
        
        this.loadedSounds.clear();
        this.animationToSounds.clear();
        this.soundEffectConfig = {};
        this.configLoaded = false;
    }
    
    getSoundConfig(): SoundEffectConfig {
        return this.soundEffectConfig;
    }
    
    getLoadedSounds(): string[] {
        return Array.from(this.loadedSounds.keys());
    }
}