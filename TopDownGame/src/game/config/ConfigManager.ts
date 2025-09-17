import { SingletonManager } from '../core/BaseManager';

export interface PlayerConfig {
    moveSpeed: number;
    health: number;
    maxHealth: number;
    invulnerabilityDuration: number;
    knockbackForce: { x: number; y: number };
    collisionSize: { width: number; height: number; offsetX: number; offsetY: number };
}

export interface BulletConfig {
    speed: number;
    lifetime: number;
    poolSize: number;
    maxPoolSize: number;
    defaultType: string;
}

export interface EnemySpawnConfig {
    spawnInterval: number;
    maxEnemies: number;
    spawnDistance: number;
    initialEnemyCount: number;
    enemyWeights: Array<{ type: string; weight: number }>;
}

export interface EnemyStatsConfig {
    [key: string]: {
        moveSpeed: number;
        health: number;
        damage: number;
        scale: number;
        trackingDistance: number;
        speedBoostDistance: number;
        speedBoostMultiplier: number;
    };
}

export interface UIConfig {
    healthUI: { x: number; y: number };
    scoreUI: { x: number; y: number; fontSize: string };
    weaponUI: { x: number; y: number; fontSize: string };
    instructionUI: { x: number; y: number; fontSize: string };
    colors: {
        text: string;
        stroke: string;
        weaponText: string;
    };
    strokeThickness: number;
    depth: number;
}

export interface PhysicsConfig {
    gravity: { x: number; y: number };
    bounce: number;
    debug: boolean;
}

export interface CameraConfig {
    lerp: { x: number; y: number };
    fadeOutDuration: number;
    fadeInDuration: number;
}

export interface GameElementConfig {
    baseSize: { width: number; height: number };
    scale: number;
    finalSize: { width: number; height: number };
    collisionScale: number;
    zDepth: number;
}

export interface StandardSizesConfig {
    tile: GameElementConfig;
    enemy: GameElementConfig;
    player: GameElementConfig;
    weapon: GameElementConfig;
    bullet: GameElementConfig;
    collectible: GameElementConfig;
}

export interface GameSettings {
    // Display settings
    display: {
        width: number;
        height: number;
        fullscreen: boolean;
        scale: number;
    };
    
    // Unified game element standards
    standardSizes: StandardSizesConfig;
    
    // Audio settings
    audio: {
        masterVolume: number;
        musicVolume: number;
        sfxVolume: number;
        muted: boolean;
    };
    
    // Gameplay settings
    gameplay: {
        difficulty: 'easy' | 'normal' | 'hard';
        showFPS: boolean;
        showHitboxes: boolean;
        autoSave: boolean;
    };
    
    // Controls settings
    controls: {
        keyboard: Record<string, string>;
        mouse: {
            sensitivity: number;
            invertY: boolean;
        };
    };
    
    // Performance settings
    performance: {
        particleQuality: 'low' | 'medium' | 'high';
        animationQuality: 'low' | 'medium' | 'high';
        maxEnemies: number;
        maxBullets: number;
    };
    
    // Game configuration
    player: PlayerConfig;
    bullet: BulletConfig;
    enemySpawn: EnemySpawnConfig;
    enemyStats: EnemyStatsConfig;
    ui: UIConfig;
    physics: PhysicsConfig;
    camera: CameraConfig;
    debug: {
        enableLogging: boolean;
        showBulletDebug: boolean;
        showCollisionBounds: boolean;
        logFrameRate: boolean;
    };
}

export interface GameConstants {
    // Tilemap constants
    tilemap: {
        baseSize: { width: number; height: number };
        scale: number;
        finalSize: { width: number; height: number };
    };
    
    // Physics constants
    physics: {
        gravity: { x: number; y: number };
        worldBounds: { width: number; height: number };
        playerSpeed: number;
        jumpPower: number;
    };
    
    // Combat constants
    combat: {
        baseDamage: number;
        criticalMultiplier: number;
        invulnerabilityTime: number;
    };
    
    // Economy constants
    economy: {
        baseScore: number;
        timeMultiplier: number;
        killMultiplier: number;
        comboBonus: number;
    };
    
    // Enemy constants
    enemies: {
        spawnRate: number;
        maxCount: number;
        difficultyScaling: number;
        speedMultiplier: number;
    };
    
    // UI constants
    ui: {
        animationDuration: number;
        fadeSpeed: number;
        colors: Record<string, string>;
        fonts: Record<string, string>;
    };
}

/**
 * ConfigManager - Centralized configuration management
 * 
 * Manages:
 * - Game settings (user preferences)
 * - Game constants (game balance)
 * - Configuration persistence
 * - Environment-specific configs
 */
export class ConfigManager extends SingletonManager {
    private settings: GameSettings;
    private constants: GameConstants;
    private environment: 'development' | 'production' | 'test' = 'development';
    
    constructor() {
        super();
        this.settings = this.getDefaultSettings();
        this.constants = this.getDefaultConstants();
    }
    
    protected onInitialize(): void {
        // Detect environment
        this.environment = this.detectEnvironment();
        
        // Load saved settings
        this.loadSettings();
        
        // Apply environment-specific overrides
        this.applyEnvironmentOverrides();
    }
    
    /**
     * Get default game settings
     */
    private getDefaultSettings(): GameSettings {
        return {
            display: {
                width: 1024,
                height: 768,
                fullscreen: false,
                scale: 1.0
            },
            standardSizes: {
                tile: {
                    baseSize: { width: 16, height: 16 },
                    scale: 4.0,
                    finalSize: { width: 64, height: 64 },
                    collisionScale: 1.0,
                    zDepth: 1
                },
                enemy: {
                    baseSize: { width: 16, height: 16 },
                    scale: 4.0,
                    finalSize: { width: 64, height: 64 },
                    collisionScale: 0.75, // 略小的碰撞体积
                    zDepth: 5
                },
                player: {
                    baseSize: { width: 16, height: 16 },
                    scale: 4.0,
                    finalSize: { width: 64, height: 64 },
                    collisionScale: 0.7,
                    zDepth: 10
                },
                weapon: {
                    baseSize: { width: 32, height: 32 },
                    scale: 2.0,
                    finalSize: { width: 64, height: 64 },
                    collisionScale: 0.8,
                    zDepth: 15  // 武器应该在玩家前面
                },
                bullet: {
                    baseSize: { width: 8, height: 8 },
                    scale: 2.0,
                    finalSize: { width: 16, height: 16 },
                    collisionScale: 0.6,
                    zDepth: 6
                },
                collectible: {
                    baseSize: { width: 16, height: 16 },
                    scale: 3.0,
                    finalSize: { width: 48, height: 48 },
                    collisionScale: 0.8,
                    zDepth: 3
                }
            },
            audio: {
                masterVolume: 1.0,
                musicVolume: 0.7,
                sfxVolume: 0.8,
                muted: false
            },
            gameplay: {
                difficulty: 'normal',
                showFPS: false,
                showHitboxes: false,
                autoSave: true
            },
            controls: {
                keyboard: {
                    moveLeft: 'A',
                    moveRight: 'D',
                    moveUp: 'W',
                    moveDown: 'S',
                    shoot: 'SPACE',
                    switchWeapon: 'E',
                    pause: 'ESC'
                },
                mouse: {
                    sensitivity: 1.0,
                    invertY: false
                }
            },
            performance: {
                particleQuality: 'medium',
                animationQuality: 'medium',
                maxEnemies: 15,
                maxBullets: 50
            },
            player: {
                moveSpeed: 150,
                health: 3,
                maxHealth: 3,
                invulnerabilityDuration: 800,
                knockbackForce: { x: 200, y: -100 },
                collisionSize: { width: 0.7, height: 0.7, offsetX: 0.15, offsetY: 0.15 }
            },
            bullet: {
                speed: 400,
                lifetime: 3000,
                poolSize: 20,
                maxPoolSize: 50,
                defaultType: 'bullets1'
            },
            enemySpawn: {
                spawnInterval: 1500,
                maxEnemies: 15,
                spawnDistance: 400,
                initialEnemyCount: 3,
                enemyWeights: [
                    { type: 'slime', weight: 50 },
                    { type: 'flying_creature', weight: 30 },
                    { type: 'goblin', weight: 20 }
                ]
            },
            enemyStats: {
                flying_creature: {
                    moveSpeed: 120,
                    health: 2,
                    damage: 1,
                    scale: 3.0,
                    trackingDistance: 1000,
                    speedBoostDistance: 200,
                    speedBoostMultiplier: 1.2
                },
                goblin: {
                    moveSpeed: 140,
                    health: 3,
                    damage: 2,
                    scale: 3.0,
                    trackingDistance: 1000,
                    speedBoostDistance: 200,
                    speedBoostMultiplier: 1.2
                },
                slime: {
                    moveSpeed: 100,
                    health: 1,
                    damage: 1,
                    scale: 3.0,
                    trackingDistance: 1000,
                    speedBoostDistance: 200,
                    speedBoostMultiplier: 1.2
                }
            },
            ui: {
                healthUI: { x: 50, y: 50 },
                scoreUI: { x: 50, y: 100, fontSize: '24px' },
                weaponUI: { x: 50, y: 160, fontSize: '18px' },
                instructionUI: { x: 50, y: 130, fontSize: '18px' },
                colors: {
                    text: '#ffffff',
                    stroke: '#000000',
                    weaponText: '#ffff00'
                },
                strokeThickness: 4,
                depth: 1000
            },
            physics: {
                gravity: { x: 0, y: 0 },
                bounce: 0.1,
                debug: false
            },
            camera: {
                lerp: { x: 0.1, y: 0.1 },
                fadeOutDuration: 250,
                fadeInDuration: 500
            },
            debug: {
                enableLogging: false,
                showBulletDebug: false,
                showCollisionBounds: false,
                logFrameRate: false
            }
        };
    }
    
    /**
     * Get default game constants
     */
    private getDefaultConstants(): GameConstants {
        return {
            tilemap: {
                baseSize: { width: 16, height: 16 },
                scale: 4,
                finalSize: { width: 64, height: 64 }
            },
            physics: {
                gravity: { x: 0, y: 0 },
                worldBounds: { width: 1024, height: 768 },
                playerSpeed: 200,
                jumpPower: 500
            },
            combat: {
                baseDamage: 1,
                criticalMultiplier: 2.0,
                invulnerabilityTime: 1000
            },
            economy: {
                baseScore: 10,
                timeMultiplier: 1.0,
                killMultiplier: 10,
                comboBonus: 1.5
            },
            enemies: {
                spawnRate: 1500,
                maxCount: 15,
                difficultyScaling: 0.1,
                speedMultiplier: 1.0
            },
            ui: {
                animationDuration: 300,
                fadeSpeed: 1000,
                colors: {
                    primary: '#FFFFFF',
                    secondary: '#FFD700',
                    danger: '#FF0000',
                    success: '#00FF00',
                    warning: '#FFA500'
                },
                fonts: {
                    primary: 'Arial Black',
                    secondary: 'Arial',
                    monospace: 'Courier New'
                }
            }
        };
    }
    
    /**
     * Detect current environment
     */
    private detectEnvironment(): 'development' | 'production' | 'test' {
        if (typeof window !== 'undefined') {
            if (window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1') {
                return 'development';
            }
        }
        
        // Check for Node.js environment
        if (typeof window === 'undefined') {
            // We're likely in Node.js environment
            try {
                // Use any to avoid TypeScript errors in browser build
                const globalVar = (globalThis as any);
                const nodeEnv = globalVar.process?.env?.NODE_ENV;
                if (nodeEnv === 'test') {
                    return 'test';
                }
                if (nodeEnv === 'development') {
                    return 'development';
                }
            } catch {
                // Ignore errors in case process is not available
            }
        }
        
        return 'production';
    }
    
    /**
     * Apply environment-specific overrides
     */
    private applyEnvironmentOverrides(): void {
        switch (this.environment) {
            case 'development':
                this.settings.gameplay.showFPS = true;
                this.constants.enemies.spawnRate *= 0.5; // Faster spawning for testing
                break;
                
            case 'test':
                this.settings.audio.muted = true;
                this.constants.ui.animationDuration = 0; // Skip animations in tests
                break;
                
            case 'production':
                this.settings.performance.particleQuality = 'high';
                this.settings.performance.animationQuality = 'high';
                break;
        }
    }
    
    /**
     * Load settings from localStorage
     */
    private loadSettings(): void {
        try {
            const savedSettings = localStorage.getItem('gameSettings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                this.settings = this.mergeDeep(this.settings, parsed);
            }
        } catch (error) {
            console.warn('Failed to load settings from localStorage:', error);
        }
    }
    
    /**
     * Save settings to localStorage
     */
    public saveSettings(): void {
        try {
            localStorage.setItem('gameSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save settings to localStorage:', error);
        }
    }
    
    /**
     * Deep merge objects
     */
    private mergeDeep(target: any, source: any): any {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.mergeDeep(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }
    
    // Settings getters/setters
    public getSettings(): GameSettings {
        return { ...this.settings };
    }
    
    public getSetting<K extends keyof GameSettings>(category: K): GameSettings[K] {
        return { ...this.settings[category] };
    }
    
    public updateSetting<K extends keyof GameSettings>(
        category: K, 
        updates: Partial<GameSettings[K]>
    ): void {
        this.settings[category] = { ...this.settings[category], ...updates };
        this.saveSettings();
    }
    
    // Constants getters
    public getConstants(): GameConstants {
        return { ...this.constants };
    }
    
    public getConstant<K extends keyof GameConstants>(category: K): GameConstants[K] {
        return { ...this.constants[category] };
    }
    
    // Convenience getters
    public getDisplaySize(): { width: number; height: number } {
        return {
            width: this.settings.display.width,
            height: this.settings.display.height
        };
    }
    
    public getVolume(type: 'master' | 'music' | 'sfx' = 'master'): number {
        if (this.settings.audio.muted) {
            return 0;
        }
        
        const master = this.settings.audio.masterVolume;
        
        switch (type) {
            case 'music':
                return master * this.settings.audio.musicVolume;
            case 'sfx':
                return master * this.settings.audio.sfxVolume;
            default:
                return master;
        }
    }
    
    public getDifficulty(): 'easy' | 'normal' | 'hard' {
        return this.settings.gameplay.difficulty;
    }
    
    public getEnvironment(): string {
        return this.environment;
    }
    
    public isDevelopment(): boolean {
        return this.environment === 'development';
    }
    
    public isProduction(): boolean {
        return this.environment === 'production';
    }
    
    // Debug methods
    public exportSettings(): string {
        return JSON.stringify(this.settings, null, 2);
    }
    
    public importSettings(settingsJson: string): void {
        try {
            const imported = JSON.parse(settingsJson);
            this.settings = this.mergeDeep(this.getDefaultSettings(), imported);
            this.saveSettings();
        } catch (error) {
            console.error('Failed to import settings:', error);
        }
    }
    
    public resetSettings(): void {
        this.settings = this.getDefaultSettings();
        this.saveSettings();
    }
    
    // Game configuration getters (for GameConfig compatibility)
    public getPlayerConfig(): PlayerConfig {
        return { ...this.settings.player };
    }
    
    public getBulletConfig(): BulletConfig {
        return { ...this.settings.bullet };
    }
    
    public getEnemySpawnConfig(): EnemySpawnConfig {
        return { ...this.settings.enemySpawn };
    }
    
    public getEnemyStatsConfig(): EnemyStatsConfig {
        return { ...this.settings.enemyStats };
    }
    
    public getUIConfig(): UIConfig {
        return { ...this.settings.ui };
    }
    
    public getPhysicsConfig(): PhysicsConfig {
        return { ...this.settings.physics };
    }
    
    public getCameraConfig(): CameraConfig {
        return { ...this.settings.camera };
    }
    
    public getDebugConfig() {
        return { ...this.settings.debug };
    }
    
    // Standard sizes configuration methods
    public getStandardSizes(): StandardSizesConfig {
        return { ...this.settings.standardSizes };
    }
    
    public getElementConfig(elementType: keyof StandardSizesConfig): GameElementConfig {
        return { ...this.settings.standardSizes[elementType] };
    }
    
    // Helper methods for common element configurations
    public getEnemyStandardConfig(): GameElementConfig {
        return this.getElementConfig('enemy');
    }
    
    public getPlayerStandardConfig(): GameElementConfig {
        return this.getElementConfig('player');
    }
    
    public getWeaponStandardConfig(): GameElementConfig {
        return this.getElementConfig('weapon');
    }
    
    public getBulletStandardConfig(): GameElementConfig {
        return this.getElementConfig('bullet');
    }
    
    // Tilemap configuration methods
    public getTilemapConstants() {
        return this.getConstant('tilemap');
    }
    
    // Game configuration update methods
    public updatePlayerConfig(updates: Partial<PlayerConfig>): void {
        this.settings.player = { ...this.settings.player, ...updates };
        this.saveSettings();
    }
    
    public updateBulletConfig(updates: Partial<BulletConfig>): void {
        this.settings.bullet = { ...this.settings.bullet, ...updates };
        this.saveSettings();
    }
    
    public updateEnemySpawnConfig(updates: Partial<EnemySpawnConfig>): void {
        this.settings.enemySpawn = { ...this.settings.enemySpawn, ...updates };
        this.saveSettings();
    }
    
    public updateDebugConfig(updates: Partial<typeof this.settings.debug>): void {
        this.settings.debug = { ...this.settings.debug, ...updates };
        this.saveSettings();
    }
    
    // Legacy compatibility methods
    public getFullConfig(): GameSettings {
        return { ...this.settings };
    }
    
    public loadConfig(externalConfig: Partial<GameSettings>): void {
        this.settings = { ...this.settings, ...externalConfig };
        this.saveSettings();
    }
    
    public exportConfig(): string {
        return JSON.stringify(this.settings, null, 2);
    }
    
    public importConfig(jsonConfig: string): void {
        try {
            const importedConfig = JSON.parse(jsonConfig);
            this.settings = this.mergeDeep(this.getDefaultSettings(), importedConfig);
            this.saveSettings();
        } catch (error) {
            console.error('Failed to import config:', error);
        }
    }
}
