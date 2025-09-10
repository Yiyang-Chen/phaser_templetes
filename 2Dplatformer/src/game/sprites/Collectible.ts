import { Scene } from 'phaser';
import { eventBus, GameEvent } from '../events/EventBus';
import { AnimationManager } from '../managers/AnimationManager';

/**
 * Collectible sprite class
 * 
 * Properties that can be configured in Tiled tilemap editor:
 * - score: (int) Points awarded when collected
 * - must_collect: (bool) Whether this item is required for level completion
 * - type: (string) Category for grouping items (e.g., "coin", "key", "gem", "powerup", etc.)
 * - rotate: (bool) Whether the item should rotate continuously
 * - particle_color: (string) Hex color for particle effects (e.g., "#FFD700")
 * 
 * If no type is specified, defaults to "misc"
 */
export class Collectible extends Phaser.Physics.Arcade.Sprite {
    private collectibleName: string;
    private collectibleType: string;
    private collected: boolean = false;
    private score: number = 0;
    private mustCollect: boolean = false;
    private shouldRotate: boolean = false;
    private particleColor: number = 0xFFFFFF;
    private properties: any = {};
    private animationManager: AnimationManager;

    constructor(scene: Scene, collectibleObject: Phaser.Types.Tilemaps.TiledObject) {
        const x = collectibleObject.x || 0;
        const y = collectibleObject.y || 0;
        const texture = collectibleObject.name || 'collectible';
        
        super(scene, x, y - 32, texture);
        
        scene.add.existing(this);
        scene.physics.add.existing(this, true);
        
        this.setOrigin(0.5, 0.5);
        this.collectibleName = collectibleObject.name || 'collectible';
        this.collectibleType = 'misc'; // Default type
        this.animationManager = AnimationManager.getInstance();
        
        this.setSize(40, 40);
        this.setOffset(12, 12);
        
        // Extract properties from the tilemap object
        this.extractProperties(collectibleObject);
        
        this.createAnimations();
        this.tryPlayIdleAnimation();
    }
    
    private extractProperties(collectibleObject: Phaser.Types.Tilemaps.TiledObject): void {
        // Get the gid to find the tileset properties
        const gid = collectibleObject.gid;
        if (!gid) return;
        
        // Find the tileset that contains this gid
        const tilemap = this.scene.cache.tilemap.get('tilemap');
        if (!tilemap || !tilemap.data) return;
        
        const tilesetData = tilemap.data.tilesets;
        for (const tileset of tilesetData) {
            if (gid >= tileset.firstgid && gid < tileset.firstgid + tileset.tilecount) {
                // Found the tileset, now get the tile properties
                const tileId = gid - tileset.firstgid;
                if (tileset.tiles && tileset.tiles[tileId]) {
                    const tileProperties = tileset.tiles[tileId].properties;
                    if (tileProperties) {
                        for (const prop of tileProperties) {
                            this.properties[prop.name] = prop.value;
                            
                            // Set specific properties
                            if (prop.name === 'score') {
                                this.score = prop.value;
                            } else if (prop.name === 'must_collect') {
                                this.mustCollect = prop.value;
                            } else if (prop.name === 'type') {
                                this.collectibleType = prop.value;
                            } else if (prop.name === 'rotate') {
                                this.shouldRotate = prop.value;
                            } else if (prop.name === 'particle_color') {
                                this.particleColor = parseInt(prop.value.replace('#', '0x'));
                            }
                        }
                    }
                }
                break;
            }
        }
        
        // Also check for properties directly on the object (these override tileset properties)
        if (collectibleObject.properties) {
            for (const prop of collectibleObject.properties) {
                this.properties[prop.name] = prop.value;
                
                if (prop.name === 'score') {
                    this.score = prop.value;
                } else if (prop.name === 'must_collect') {
                    this.mustCollect = prop.value;
                } else if (prop.name === 'type') {
                    this.collectibleType = prop.value;
                } else if (prop.name === 'rotate') {
                    this.shouldRotate = prop.value;
                } else if (prop.name === 'particle_color') {
                    this.particleColor = parseInt(prop.value.replace('#', '0x'));
                }
            }
        }
    }


    private tryPlayIdleAnimation(): void {
        // Try to play idle animation using AnimationManager
        const atlasKey = this.collectibleName;
        
        // First check if animations exist for this atlas/texture
        if (this.animationManager.hasAnimation(atlasKey, 'idle')) {
            this.animationManager.playAnimation(this, atlasKey, 'idle');
        } else {
            // Try to create animations if they don't exist
            this.animationManager.createAnimationsForAtlas(atlasKey);
            
            // Check again after attempting to create
            if (this.animationManager.hasAnimation(atlasKey, 'idle')) {
                this.animationManager.playAnimation(this, atlasKey, 'idle');
            }
            // If still no idle animation, it will just display as static image
        }
    }

    private createAnimations(): void {
        // Floating animation
        this.scene.tweens.add({
            targets: this,
            y: this.y - 10,
            duration: 1500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // Rotation animation if configured
        if (this.shouldRotate) {
            this.scene.tweens.add({
                targets: this,
                angle: 360,
                duration: 3000,
                ease: 'Linear',
                repeat: -1
            });
        }
        
        // Pulsing animation (for both atlas and static images)
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 800,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    collect(): void {
        if (this.collected) return;
        
        this.collected = true;
        
        // Emit item collect event
        eventBus.emit(GameEvent.ITEM_COLLECT, {
            item: this,
            type: this.collectibleType,
            value: this.score
        });
        
        // Collection animation
        this.scene.tweens.add({
            targets: this,
            y: this.y - 50,
            alpha: 0,
            scale: 1.5,
            duration: 500,
            ease: 'Back.easeIn',
            onComplete: () => {
                this.destroy();
            }
        });
        
        // Particle effect - use configured color
        
        for (let i = 0; i < 8; i++) {
            this.scene.time.delayedCall(i * 30, () => {
                const particle = this.scene.add.circle(
                    this.x + Phaser.Math.Between(-20, 20),
                    this.y + Phaser.Math.Between(-20, 20),
                    3,
                    this.particleColor
                );
                
                this.scene.tweens.add({
                    targets: particle,
                    x: particle.x + Phaser.Math.Between(-30, 30),
                    y: particle.y - Phaser.Math.Between(20, 40),
                    alpha: 0,
                    duration: 600,
                    ease: 'Power2',
                    onComplete: () => {
                        particle.destroy();
                    }
                });
            });
        }
    }

    isCollected(): boolean {
        return this.collected;
    }
    
    getScore(): number {
        return this.score;
    }
    
    isMustCollect(): boolean {
        return this.mustCollect;
    }
    
    getName(): string {
        return this.collectibleName;
    }
    
    getType(): string {
        return this.collectibleType;
    }
    
    getProperties(): any {
        return this.properties;
    }
}