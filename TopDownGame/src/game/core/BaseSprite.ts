import { Scene } from 'phaser';
import { eventBus, GameEvent } from '../events/EventBus';

export interface SpriteConfig {
    name?: string;
    damage?: number;
    health?: number;
    speed?: number;
    scale?: number;
    depth?: number;
    properties?: Record<string, any>;
}

/**
 * BaseSprite - Abstract base class for all game sprites
 * 
 * Provides common functionality:
 * - Property-based configuration from tilemap
 * - Event bus integration
 * - Animation management
 * - Common sprite behaviors
 */
export abstract class BaseSprite extends Phaser.Physics.Arcade.Sprite {
    protected spriteName: string = '';
    protected spriteType: string = '';
    protected isDestroyed: boolean = false;
    protected properties: Record<string, any> = {};
    
    // Common sprite properties
    protected maxHealth: number = 1;
    protected currentHealth: number = 1;
    protected damage: number = 1;
    protected moveSpeed: number = 100;
    
    constructor(
        scene: Scene, 
        x: number, 
        y: number, 
        texture: string, 
        frame?: string | number,
        config?: SpriteConfig
    ) {
        super(scene, x, y, texture, frame);
        
        // Apply configuration
        if (config) {
            this.applyConfig(config);
        }
        
        // Add to scene
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set default properties
        this.setOrigin(0.5, 0.5);
        
        // Initialize sprite
        this.initialize();
    }
    
    /**
     * Apply configuration from tilemap or other sources
     */
    protected applyConfig(config: SpriteConfig): void {
        this.spriteName = config.name || this.spriteName;
        this.maxHealth = config.health || this.maxHealth;
        this.currentHealth = this.maxHealth;
        this.damage = config.damage || this.damage;
        this.moveSpeed = config.speed || this.moveSpeed;
        this.properties = { ...config.properties };
        
        if (config.scale) {
            this.setScale(config.scale);
        }
        
        if (config.depth !== undefined) {
            this.setDepth(config.depth);
        }
    }
    
    /**
     * Configure sprite from tilemap object properties
     */
    public static configFromTilemapObject(obj: Phaser.Types.Tilemaps.TiledObject): SpriteConfig {
        const config: SpriteConfig = {
            name: obj.name || '',
            properties: {}
        };
        
        // Parse properties from tilemap
        if (obj.properties) {
            obj.properties.forEach((prop: any) => {
                switch (prop.name) {
                    case 'damage':
                        config.damage = prop.value;
                        break;
                    case 'health':
                        config.health = prop.value;
                        break;
                    case 'speed':
                        config.speed = prop.value;
                        break;
                    case 'scale':
                        config.scale = prop.value;
                        break;
                    default:
                        if (config.properties) {
                            config.properties[prop.name] = prop.value;
                        }
                        break;
                }
            });
        }
        
        return config;
    }
    
    /**
     * Initialize sprite - override in subclasses
     */
    protected initialize(): void {
        // Override in subclasses
    }
    
    /**
     * Take damage and handle death
     */
    public takeDamage(damage: number, source?: string): void {
        if (this.isDestroyed) {
            return;
        }
        
        this.currentHealth -= damage;
        
        // Emit damage event
        eventBus.emit(GameEvent.PLAYER_DAMAGE, {
            player: this,
            damage,
            source: source || 'unknown'
        });
        
        // Visual feedback
        this.onDamage(damage);
        
        // Check for death
        if (this.currentHealth <= 0) {
            this.die();
        }
    }
    
    /**
     * Handle visual feedback for damage
     */
    protected onDamage(damage: number): void {
        // Tint red briefly
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            if (!this.isDestroyed) {
                this.clearTint();
            }
        });
    }
    
    /**
     * Handle death
     */
    protected die(): void {
        if (this.isDestroyed) {
            return;
        }
        
        this.isDestroyed = true;
        this.onDeath();
        
        // Emit death event
        eventBus.emit(GameEvent.ENEMY_DEATH, {
            enemy: this,
            type: this.spriteType,
            position: { x: this.x, y: this.y },
            killedBy: 'unknown'
        });
    }
    
    /**
     * Handle death logic - override in subclasses
     */
    protected onDeath(): void {
        // Create death effect
        this.createDeathEffect();
        
        // Destroy sprite
        this.destroy();
    }
    
    /**
     * Create death effect
     */
    protected createDeathEffect(): void {
        // Default death effect - particles
        const particles = this.scene.add.particles(this.x, this.y, 'particles', {
            speed: { min: 50, max: 100 },
            scale: { start: 0.5, end: 0 },
            lifespan: 300,
            quantity: 8
        });
        
        // Cleanup particles
        this.scene.time.delayedCall(500, () => {
            particles.destroy();
        });
    }
    
    /**
     * Play animation safely
     */
    protected playAnimation(key: string, ignoreIfPlaying: boolean = false): void {
        if (this.isDestroyed) {
            return;
        }
        
        try {
            this.play(key, ignoreIfPlaying);
            
            eventBus.emit(GameEvent.ANIMATION_PLAY, {
                sprite: this,
                animation: key
            });
        } catch (error) {
            console.warn(`Failed to play animation ${key} on ${this.spriteName}:`, error);
        }
    }
    
    /**
     * Stop current animation safely
     */
    protected stopAnimation(): void {
        if (this.isDestroyed) {
            return;
        }
        
        this.stop();
        
        eventBus.emit(GameEvent.ANIMATION_STOP, {
            sprite: this
        });
    }
    
    /**
     * Get sprite configuration data
     */
    public getConfig(): SpriteConfig {
        return {
            name: this.spriteName,
            damage: this.damage,
            health: this.maxHealth,
            speed: this.moveSpeed,
            scale: this.scale,
            depth: this.depth,
            properties: { ...this.properties }
        };
    }
    
    // Getters
    public getName(): string {
        return this.spriteName;
    }
    
    public getType(): string {
        return this.spriteType;
    }
    
    public getHealth(): number {
        return this.currentHealth;
    }
    
    public getMaxHealth(): number {
        return this.maxHealth;
    }
    
    public getDamage(): number {
        return this.damage;
    }
    
    public getSpeed(): number {
        return this.moveSpeed;
    }
    
    public getProperty(key: string): any {
        return this.properties[key];
    }
    
    public isAlive(): boolean {
        return !this.isDestroyed && this.currentHealth > 0;
    }
    
    // Setters
    public setProperty(key: string, value: any): void {
        this.properties[key] = value;
    }
    
    public setSpeed(speed: number): void {
        this.moveSpeed = speed;
    }
    
    /**
     * Clean up sprite resources
     */
    public destroy(fromScene?: boolean): void {
        this.isDestroyed = true;
        super.destroy(fromScene);
    }
}
