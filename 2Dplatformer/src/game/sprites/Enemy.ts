import { Scene } from 'phaser';
import { eventBus, GameEvent } from '../events/EventBus';
import { AnimationManager } from '../managers/AnimationManager';

/**
 * Generic Enemy sprite class
 * 
 * Properties that can be configured in Tiled tilemap editor:
 * - damage: (int) Damage dealt to player on contact
 * - move_method: (string) Movement pattern:
 *   - "static": No movement
 *   - "patrol": Walk back and forth on ground
 *   - "jump": Jump in place without moving
 *   - "move_and_jump": Move forward by jumping (like a frog)
 *   - "patrol_jump": Walk and occasionally jump
 *   - "follow": Follow player when in range
 *   - "follow_jump": Follow player and jump when needed
 * - move_speed: (int) Movement speed (default: 100)
 * - jump_power: (int) Jump strength (default: 400)
 * - patrol_distance: (int) Distance to patrol in pixels (default: 200)
 * - detection_range: (int) Range to detect player for follow mode (default: 300)
 * - jump_interval: (int) Time between jumps in milliseconds (default: 2000)
 * - death_particle_color: (string/hex) Color of death particles (default: "#ff0000")
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
    private enemyName: string;
    private damage: number = 1;
    private moveMethod: string = 'static';
    private moveSpeed: number = 100;
    private jumpPower: number = 400;
    private patrolDistance: number = 200;
    private detectionRange: number = 300;
    private jumpInterval: number = 2000;
    private deathParticleColor: number = 0xff0000;  // Default red
    
    // Movement state
    private startX: number;
    private direction: number = 1; // 1 for right, -1 for left
    private lastJumpTime: number = 0;
    private isGrounded: boolean = false;
    private player: any = null;
    
    // Animation state
    private currentAnimation: string = '';
    private hasAtlas: boolean = false;
    private animationManager: AnimationManager;

    constructor(scene: Scene, enemyObject: Phaser.Types.Tilemaps.TiledObject) {
        const x = enemyObject.x || 0;
        const y = enemyObject.y || 0;
        const height = enemyObject.height || 64;
        const texture = enemyObject.name || 'enemy';
        
        // Convert Tiled bottom coordinate to Phaser center coordinate
        super(scene, x, y - height / 2, texture);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setOrigin(0.5, 0.5);
        this.enemyName = enemyObject.name || 'enemy';
        this.animationManager = AnimationManager.getInstance();
        
        // Store starting position for patrol
        this.startX = this.x;
        
        // Set up physics
        this.setBounce(0.1);
        
        // Set size based on texture
        const textureFrame = this.texture.get(0);
        const bodyWidth = textureFrame.width * 0.8;
        const bodyHeight = textureFrame.height * 0.8;
        this.setSize(bodyWidth, bodyHeight);
        this.setOffset(bodyWidth * 0.1, bodyHeight * 0.1);
        
        // Extract properties from tilemap
        this.extractProperties(enemyObject);
        
        // Try to play idle animation
        this.tryPlayIdleAnimation();
        
        // Start initial movement
        this.initializeMovement();
    }
    
    private extractProperties(enemyObject: Phaser.Types.Tilemaps.TiledObject): void {
        // Get properties from tileset
        const gid = enemyObject.gid;
        if (gid) {
            const tilemap = this.scene.cache.tilemap.get('tilemap');
            if (tilemap && tilemap.data) {
                const tilesetData = tilemap.data.tilesets;
                for (const tileset of tilesetData) {
                    if (gid >= tileset.firstgid && gid < tileset.firstgid + tileset.tilecount) {
                        const tileId = gid - tileset.firstgid;
                        if (tileset.tiles && tileset.tiles[tileId]) {
                            const tileProperties = tileset.tiles[tileId].properties;
                            if (tileProperties) {
                                for (const prop of tileProperties) {
                                    this.setProperty(prop.name, prop.value);
                                }
                            }
                        }
                        break;
                    }
                }
            }
        }
        
        // Override with object-specific properties
        if (enemyObject.properties) {
            for (const prop of enemyObject.properties) {
                this.setProperty(prop.name, prop.value);
            }
        }
    }
    
    private setProperty(name: string, value: any): void {
        switch (name) {
            case 'damage':
                this.damage = value;
                break;
            case 'move_method':
                this.moveMethod = value;
                break;
            case 'move_speed':
                this.moveSpeed = value;
                break;
            case 'jump_power':
                this.jumpPower = value;
                break;
            case 'patrol_distance':
                this.patrolDistance = value;
                break;
            case 'detection_range':
                this.detectionRange = value;
                break;
            case 'jump_interval':
                this.jumpInterval = value;
                break;
            case 'atlas':
                this.hasAtlas = value;
                break;
            case 'death_particle_color':
                // Convert hex string to number if needed
                if (typeof value === 'string') {
                    this.deathParticleColor = parseInt(value.replace('#', '0x'));
                } else {
                    this.deathParticleColor = value;
                }
                break;
        }
    }
    
    
    private initializeMovement(): void {
        // Set initial movement based on move method
        switch (this.moveMethod) {
            case 'patrol':
                this.setVelocityX(this.moveSpeed * this.direction);
                this.playEnemyAnimation('walk');
                break;
            case 'jump':
                this.playEnemyAnimation('idle');
                break;
            case 'move_and_jump':
                this.playEnemyAnimation('idle');
                break;
            case 'patrol_jump':
                this.setVelocityX(this.moveSpeed * this.direction);
                this.playEnemyAnimation('walk');
                break;
            case 'static':
            default:
                this.setVelocityX(0);
                this.playEnemyAnimation('idle');
                break;
        }
    }
    
    private tryPlayIdleAnimation(): void {
        const atlasKey = this.enemyName;
        
        // First check if animations exist for this atlas/texture
        if (this.animationManager.hasAnimation(atlasKey, 'idle')) {
            this.animationManager.playAnimation(this, atlasKey, 'idle');
            this.hasAtlas = true;
        } else {
            // Try to create animations if they don't exist
            this.animationManager.createAnimationsForAtlas(atlasKey);
            
            // Check again after attempting to create
            if (this.animationManager.hasAnimation(atlasKey, 'idle')) {
                this.animationManager.playAnimation(this, atlasKey, 'idle');
                this.hasAtlas = true;
            }
        }
    }
    
    private playEnemyAnimation(animType: string): void {
        if (!this.hasAtlas) return;
        
        // Emit animation play event - the AnimationManager will handle fallback logic
        if (this.currentAnimation !== `${this.enemyName}_${animType}`) {
            this.currentAnimation = `${this.enemyName}_${animType}`;
            
            eventBus.emit(GameEvent.ANIMATION_PLAY, {
                sprite: this,
                atlasKey: this.enemyName,
                animationName: animType
            });
            
            // Emit sound effect play event
            eventBus.emit(GameEvent.SOUND_EFFECT_PLAY, {
                key: `${this.enemyName}_${animType}`,
                atlasKey: this.enemyName,
                animationName: animType,
                volume: 0.4
            });
        }
    }
    
    update(time: number, _delta: number): void {
        // Check if grounded
        this.isGrounded = this.body?.blocked.down || false;
        
        // Find player reference if needed
        if (!this.player && (this.moveMethod === 'follow' || this.moveMethod === 'follow_jump')) {
            const gameScene = this.scene as any;
            this.player = gameScene.player;
        }
        
        // Update movement based on method
        switch (this.moveMethod) {
            case 'patrol':
                this.updatePatrol();
                break;
            case 'jump':
                this.updateJump(time);
                break;
            case 'move_and_jump':
                this.updateMoveAndJump(time);
                break;
            case 'patrol_jump':
                this.updatePatrolJump(time);
                break;
            case 'follow':
                this.updateFollow();
                break;
            case 'follow_jump':
                this.updateFollowJump(time);
                break;
            case 'static':
            default:
                // No movement
                break;
        }
        
        // Update sprite flip based on direction
        if (this.direction < 0) {
            this.setFlipX(true);
        } else if (this.direction > 0) {
            this.setFlipX(false);
        }
    }
    
    private updatePatrol(): void {
        // Check patrol boundaries
        if (Math.abs(this.x - this.startX) >= this.patrolDistance / 2) {
            this.direction *= -1;
            this.setVelocityX(this.moveSpeed * this.direction);
        }
        
        // Check for obstacles
        if (this.body?.blocked.left && this.direction < 0) {
            this.direction = 1;
            this.setVelocityX(this.moveSpeed * this.direction);
        } else if (this.body?.blocked.right && this.direction > 0) {
            this.direction = -1;
            this.setVelocityX(this.moveSpeed * this.direction);
        }
        
        // Update animation
        if (this.isGrounded && Math.abs(this.body?.velocity.x || 0) > 10) {
            this.playEnemyAnimation('walk');
        }
    }
    
    private updateJump(time: number): void {
        // Jump in place - no horizontal movement
        if (this.isGrounded && time - this.lastJumpTime > this.jumpInterval) {
            this.setVelocityY(-this.jumpPower);
            this.lastJumpTime = time;
            this.playEnemyAnimation('jump');
            
            // Play jump sound through event
            eventBus.emit(GameEvent.SOUND_EFFECT_PLAY, {
                key: `${this.enemyName}_jump`,
                atlasKey: this.enemyName,
                animationName: 'jump',
                volume: 0.3
            });
        } else if (this.isGrounded) {
            this.setVelocityX(0);
            this.playEnemyAnimation('idle');
        }
    }
    
    private updatePatrolJump(time: number): void {
        // Walk and occasionally jump
        this.updatePatrol();
        
        // Add periodic jumps while walking
        if (this.isGrounded && time - this.lastJumpTime > this.jumpInterval) {
            this.setVelocityY(-this.jumpPower);
            this.lastJumpTime = time;
            this.playEnemyAnimation('jump');
            
            // Play jump sound through event
            eventBus.emit(GameEvent.SOUND_EFFECT_PLAY, {
                key: `${this.enemyName}_jump`,
                atlasKey: this.enemyName,
                animationName: 'jump',
                volume: 0.3
            });
        }
    }
    
    private updateMoveAndJump(time: number): void {
        // Move forward by jumping (like a frog)
        if (this.isGrounded && time - this.lastJumpTime > this.jumpInterval) {
            // Check patrol boundaries
            if (Math.abs(this.x - this.startX) >= this.patrolDistance / 2) {
                this.direction *= -1;
            }
            
            // Jump forward in current direction
            this.setVelocity(this.moveSpeed * this.direction, -this.jumpPower);
            this.lastJumpTime = time;
            this.playEnemyAnimation('jump');
            
            // Play jump sound through event
            eventBus.emit(GameEvent.SOUND_EFFECT_PLAY, {
                key: `${this.enemyName}_jump`,
                atlasKey: this.enemyName,
                animationName: 'jump',
                volume: 0.3
            });
        } else if (this.isGrounded) {
            // Stop horizontal movement when on ground (waiting to jump)
            this.setVelocityX(0);
            this.playEnemyAnimation('idle');
        }
    }
    
    private updateFollow(): void {
        if (!this.player) return;
        
        const distance = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y);
        
        if (distance < this.detectionRange) {
            // Move towards player
            const dx = this.player.x - this.x;
            this.direction = Math.sign(dx);
            
            if (Math.abs(dx) > 10) {
                this.setVelocityX(this.moveSpeed * this.direction);
                this.playEnemyAnimation('walk');
            } else {
                this.setVelocityX(0);
                this.playEnemyAnimation('idle');
            }
        } else {
            // Stop when player is out of range
            this.setVelocityX(0);
            this.playEnemyAnimation('idle');
        }
    }
    
    private updateFollowJump(time: number): void {
        this.updateFollow();
        
        // Jump when player is above
        if (this.player && this.isGrounded && time - this.lastJumpTime > this.jumpInterval) {
            const dy = this.player.y - this.y;
            if (dy < -50) {
                this.setVelocityY(-this.jumpPower);
                this.lastJumpTime = time;
                this.playEnemyAnimation('jump');
                
                // Play jump sound through event
                eventBus.emit(GameEvent.SOUND_EFFECT_PLAY, {
                    key: `${this.enemyName}_jump`,
                    atlasKey: this.enemyName,
                    animationName: 'jump',
                    volume: 0.3
                });
            }
        }
    }
    
    getDamage(): number {
        return this.damage;
    }
    
    takeDamage(_damage: number): void {
        // Play death sound effect through events
        eventBus.emit(GameEvent.SOUND_EFFECT_PLAY, {
            key: `${this.enemyName}_die`,
            atlasKey: this.enemyName,
            animationName: 'die',
            volume: 0.6
        });
        
        // Also try hit sound as fallback
        eventBus.emit(GameEvent.SOUND_EFFECT_PLAY, {
            key: `${this.enemyName}_hit`,
            atlasKey: this.enemyName,
            animationName: 'hit',
            volume: 0.6
        });
        
        // Create death effects before destroying the enemy
        this.createDeathEffects();
        
        // Disable physics body immediately
        if (this.body) {
            this.body.enable = false;
        }
        
        // Death animation: scale up, fade out, and rotate
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            rotation: Math.PI * 2,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.destroy();
            }
        });
        
        // Flash effect
        this.scene.tweens.add({
            targets: this,
            tint: { from: 0xffffff, to: 0xff0000 },
            duration: 100,
            yoyo: true,
            repeat: 2
        });
    }
    
    private createDeathEffects(): void {
        // Create particle explosion effect
        // Use configured color as base, create variations
        const baseColor = this.deathParticleColor;
        const particleColors = [
            baseColor,
            this.lightenColor(baseColor, 0.3),
            this.darkenColor(baseColor, 0.3),
            0xffff00  // Always add some yellow for impact
        ];
        const particleCount = 12;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = Phaser.Math.Between(100, 300);
            const size = Phaser.Math.Between(2, 6);
            const color = Phaser.Utils.Array.GetRandom(particleColors);
            
            // Create particle
            const particle = this.scene.add.circle(
                this.x,
                this.y,
                size,
                color
            );
            
            // Animate particle
            this.scene.physics.add.existing(particle);
            const body = particle.body as Phaser.Physics.Arcade.Body;
            body.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 100
            );
            body.setGravityY(300);
            body.setBounce(0.5);
            
            // Fade out and destroy
            this.scene.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 0,
                duration: 1000,
                ease: 'Power2',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
        
        // Create star burst effect
        for (let i = 0; i < 5; i++) {
            this.scene.time.delayedCall(i * 50, () => {
                const star = this.scene.add.star(
                    this.x + Phaser.Math.Between(-20, 20),
                    this.y + Phaser.Math.Between(-20, 20),
                    5,
                    3,
                    6,
                    0xffff00
                );
                star.setScale(0);
                
                this.scene.tweens.add({
                    targets: star,
                    scale: { from: 0, to: 1.5 },
                    alpha: { from: 1, to: 0 },
                    rotation: Math.PI * 2,
                    duration: 500,
                    ease: 'Power2',
                    onComplete: () => {
                        star.destroy();
                    }
                });
            });
        }
        
        // Create impact wave effect
        const wave = this.scene.add.circle(this.x, this.y, 10, 0xffffff, 0.5);
        
        this.scene.tweens.add({
            targets: wave,
            scale: { from: 1, to: 4 },
            alpha: { from: 0.5, to: 0 },
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                wave.destroy();
            }
        });
        
        // Screen shake effect (small)
        if (this.scene.cameras.main) {
            this.scene.cameras.main.shake(100, 0.005);
        }
        
        // Create "poof" smoke effect
        for (let i = 0; i < 8; i++) {
            const smoke = this.scene.add.circle(
                this.x + Phaser.Math.Between(-10, 10),
                this.y + Phaser.Math.Between(-10, 10),
                Phaser.Math.Between(8, 15),
                0x888888,
                0.6
            );
            
            this.scene.tweens.add({
                targets: smoke,
                x: smoke.x + Phaser.Math.Between(-30, 30),
                y: smoke.y - Phaser.Math.Between(10, 40),
                scale: { from: 1, to: 2 },
                alpha: { from: 0.6, to: 0 },
                duration: 600,
                delay: i * 30,
                ease: 'Power2',
                onComplete: () => {
                    smoke.destroy();
                }
            });
        }
    }
    
    getMoveMethod(): string {
        return this.moveMethod;
    }
    
    private lightenColor(color: number, amount: number): number {
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;
        
        const newR = Math.min(255, r + (255 - r) * amount);
        const newG = Math.min(255, g + (255 - g) * amount);
        const newB = Math.min(255, b + (255 - b) * amount);
        
        return (newR << 16) | (newG << 8) | newB;
    }
    
    private darkenColor(color: number, amount: number): number {
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;
        
        const newR = Math.max(0, r * (1 - amount));
        const newG = Math.max(0, g * (1 - amount));
        const newB = Math.max(0, b * (1 - amount));
        
        return (newR << 16) | (newG << 8) | newB;
    }
}