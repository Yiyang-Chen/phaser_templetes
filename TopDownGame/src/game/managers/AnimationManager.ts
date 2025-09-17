import { SingletonManager } from '../core/BaseManager';

/**
 * Animation configuration interface
 */
export interface AnimationConfig {
    key: string;                // Animation key (e.g., "walk", "jump", "idle")
    frames?: string[];          // Specific frame names
    prefix?: string;            // Frame prefix for auto-generation
    start?: number;             // Start frame number
    end?: number;               // End frame number
    zeroPad?: number;           // Zero padding for frame numbers
    suffix?: string;            // Frame suffix
    frameRate?: number;         // Animation frame rate
    repeat?: number;            // Repeat count (-1 for infinite)
    yoyo?: boolean;             // Yoyo animation
}

/**
 * Atlas animation configuration
 */
export interface AtlasAnimationConfig {
    atlas: string;              // Atlas key
    animations: AnimationConfig[];  // List of animations for this atlas
}

/**
 * Legacy animation format (from existing JSON files)
 */
export interface LegacyAnimationFormat {
    name: string;
    type?: string;
    animations: Array<{
        name: string;
        filename_prefix?: string;
        frame_range?: {
            from: number;
            to: number;
        };
        frames?: string[];
        padding_size?: number;
    }>;
}

/**
 * AnimationManager - Centralized animation management system
 * 
 * This manager handles:
 * - Loading animation configurations
 * - Creating Phaser animations from configurations
 * - Tracking which animations belong to which atlas
 * - Providing helper methods to play animations
 */
export class AnimationManager extends SingletonManager {
    private atlasAnimations: Map<string, AnimationConfig[]> = new Map();
    private createdAnimations: Set<string> = new Set();
    
    protected onInitialize(): void {
        // AnimationManager specific initialization
        this.atlasAnimations.clear();
        this.createdAnimations.clear();
    }
    
    protected onCleanup(): void {
        // Clean up animations
        this.atlasAnimations.clear();
        this.createdAnimations.clear();
    }
    
    /**
     * Load animation configuration from JSON
     */
    loadAnimationConfig(_key: string, config: AtlasAnimationConfig[]): void {
        for (const atlasConfig of config) {
            this.registerAtlasAnimations(atlasConfig.atlas, atlasConfig.animations);
        }
    }
    
    /**
     * Load legacy animation format (converts to new format)
     */
    loadLegacyAnimationConfig(config: LegacyAnimationFormat): void {
        const atlasKey = config.name;
        const animations: AnimationConfig[] = [];
        

        
        for (const anim of config.animations) {

            if (anim.frames) {
                // New format with explicit frame names
                animations.push({
                    key: anim.name,
                    frames: anim.frames,
                    frameRate: 10,
                    repeat: -1
                });
            } else if (anim.frame_range && anim.filename_prefix) {
                // Legacy format with frame range
                animations.push({
                    key: anim.name,
                    prefix: anim.filename_prefix,
                    start: anim.frame_range.from,
                    end: anim.frame_range.to,
                    zeroPad: anim.padding_size || 4,
                    frameRate: 10,
                    repeat: -1
                });
            } else {
                console.warn(`Invalid animation config for ${anim.name}: missing frames or frame_range`);
            }
        }
        
        this.registerAtlasAnimations(atlasKey, animations);
    }
    
    /**
     * Register animations for an atlas
     */
    registerAtlasAnimations(atlasKey: string, animations: AnimationConfig[]): void {
        this.atlasAnimations.set(atlasKey, animations);
    }
    
    /**
     * Create all animations for a specific atlas
     */
    createAnimationsForAtlas(atlasKey: string): void {
        const animations = this.atlasAnimations.get(atlasKey);
        if (!animations) {
            console.warn(`No animations registered for atlas: ${atlasKey}`);
            return;
        }
        
        for (const animConfig of animations) {
            this.createAnimation(atlasKey, animConfig);
        }
    }
    
    /**
     * Create a single animation
     */
    private createAnimation(atlasKey: string, config: AnimationConfig): void {
        const animKey = `${atlasKey}_${config.key}`;
        
        // Check if animation already exists
        if (this.createdAnimations.has(animKey)) {
            return;
        }
        
        // Check if the animation already exists in the scene
        if (this.scene.anims.exists(animKey)) {
            this.createdAnimations.add(animKey);
            return;
        }
        
        // Check if atlas exists
        if (!this.scene.textures.exists(atlasKey)) {
            console.warn(`Atlas not found: ${atlasKey}`);
            return;
        }
        
        let frames: Phaser.Types.Animations.AnimationFrame[] = [];
        
        // Generate frames based on configuration
        if (config.frames) {
            // Use specific frame names
            // First, verify that the frames exist in the atlas
            const atlas = this.getScene().textures.get(atlasKey);

            
            // Get available frame names properly
            const frameNames = atlas.getFrameNames();

            
            for (const frameName of config.frames) {
                if (!atlas.has(frameName)) {
                    console.warn(`Frame not found in atlas ${atlasKey}: ${frameName}`);

                    return;
                }
            }
            
            frames = config.frames.map(frameName => ({
                key: atlasKey,
                frame: frameName
            }));
        } else if (config.prefix !== undefined) {
            // Generate frame names with prefix
            const start = config.start || 0;
            const end = config.end || 0;
            const zeroPad = config.zeroPad || 4;
            const suffix = config.suffix || '';
            
            // Check if frames exist before creating animation
            const testFrame = `${config.prefix}${String(start).padStart(zeroPad, '0')}${suffix}`;
            if (!this.getScene().textures.get(atlasKey).has(testFrame)) {
                console.warn(`Frame not found in atlas ${atlasKey}: ${testFrame}`);
                return;
            }
            
            frames = this.getScene().anims.generateFrameNames(atlasKey, {
                prefix: config.prefix,
                start: start,
                end: end,
                zeroPad: zeroPad,
                suffix: suffix
            });
        }
        
        if (frames.length === 0) {
            console.warn(`No frames generated for animation: ${animKey}`);
            return;
        }
        
        // Create the animation
        try {

            const frameRate = config.frameRate || 10;
            const duration = (frames.length / frameRate) * 1000; // Convert to milliseconds
            
            this.getScene().anims.create({
                key: animKey,
                frames: frames,
                frameRate: frameRate,
                duration: duration,
                repeat: config.repeat !== undefined ? config.repeat : -1,
                yoyo: config.yoyo || false
            });
            
            this.createdAnimations.add(animKey);

        } catch (error) {
            console.error(`Error creating animation ${animKey}:`, error);
        }
    }
    
    /**
     * Create all registered animations
     */
    createAllAnimations(): void {
        for (const [atlasKey, _] of this.atlasAnimations) {
            this.createAnimationsForAtlas(atlasKey);
        }
    }
    
    /**
     * Get animation key for an atlas and animation name
     */
    getAnimationKey(atlasKey: string, animationName: string): string {
        return `${atlasKey}_${animationName}`;
    }
    
    /**
     * Check if an animation exists
     */
    hasAnimation(atlasKey: string, animationName: string): boolean {
        const animKey = this.getAnimationKey(atlasKey, animationName);
        return this.createdAnimations.has(animKey);
    }
    
    /**
     * Get all animation keys for an atlas
     */
    getAtlasAnimations(atlasKey: string): string[] {
        const animations = this.atlasAnimations.get(atlasKey);
        if (!animations) return [];
        
        return animations.map(anim => this.getAnimationKey(atlasKey, anim.key));
    }
    
    /**
     * Play animation on a sprite
     */
    playAnimation(sprite: Phaser.GameObjects.Sprite, atlasKey: string, animationName: string, ignoreIfPlaying: boolean = true): void {
        const animKey = this.getAnimationKey(atlasKey, animationName);
        
        if (!this.createdAnimations.has(animKey)) {
            console.warn(`Animation not found: ${animKey}`);
            return;
        }
        
        sprite.play(animKey, ignoreIfPlaying);
    }
    
    /**
     * Clear all animations
     */
    clear(): void {
        // Note: We don't destroy animations from scene.anims as they might be used elsewhere
        this.atlasAnimations.clear();
        this.createdAnimations.clear();
    }
    
    /**
     * Get animation configuration for an atlas
     */
    getAnimationConfig(atlasKey: string): AnimationConfig[] | undefined {
        return this.atlasAnimations.get(atlasKey);
    }
}