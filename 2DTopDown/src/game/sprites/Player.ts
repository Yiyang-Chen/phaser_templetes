import Phaser from 'phaser';
import { eventBus, GameEvent } from '../events/EventBus';
import { Bullet } from './Bullet';
import { MobileControls } from '../ui/MobileControls';
import { AimingSystem } from '../systems/AimingSystem';

interface PlayerAbilities {
    canShoot: boolean;
    canMove: boolean;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasdKeys: {
        W: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
    };
    private moveSpeed: number = 200;
    private currentAnimation: string = '';
    private key: string = '';
    
    // Ability configuration
    private abilities: PlayerAbilities = {
        canShoot: true,
        canMove: true
    };
    
    // Health and damage
    private health: number = 3;
    private maxHealth: number = 3;
    private isInvulnerable: boolean = false;
    private knockbackTime: number = 0;
    private isDead: boolean = false;
    
    // Terrain stuck detection
    private stuckCheckTimer: number = 0;
    private stuckCheckInterval: number = 100; // Check every 100ms
    private isFloatingUp: boolean = false;
    private floatUpSpeed: number = -200; // Speed to float up when stuck
    
    // Shooting
    private shootKey: Phaser.Input.Keyboard.Key;
    private canShoot: boolean = true;
    private shootCooldown: number = 500;
    private lastShootTime: number = 0;
    
    // Mobile controls
    private mobileControls: MobileControls | null = null;
    private mobileShootPressed: boolean = false;
    
    // Aiming system
    private aimingSystem: AimingSystem;

    constructor(scene: Phaser.Scene, tiledObject: Phaser.Types.Tilemaps.TiledObject) {
        let x = tiledObject.x ?? 0;
        let y = tiledObject.y ?? 0;
        let height = tiledObject.height ?? 64;

        let key = tiledObject.name;

        // Convert Tiled bottom coordinate to Phaser center coordinate
        super(scene, x, y - height / 2, key);

        this.key = key;
        
        // Read properties from tilemap
        const properties = tiledObject.properties as any[];
        if (properties) {
            // Health configuration
            const maxHealthProp = properties.find(prop => prop.name === 'max_health');
            if (maxHealthProp && maxHealthProp.value > 0) {
                this.maxHealth = maxHealthProp.value;
                this.health = this.maxHealth;
            }
            
            // Ability configuration
            this.parseAbilityProperties(properties);
        }

        scene.add.existing(this);
        scene.physics.add.existing(this);

        let texture = scene.textures.get(key);
        let firstFrame = (texture.frames as any)[texture.firstFrame];

        let displayWidth = (tiledObject.width ?? firstFrame.width);
        let displayHeight = (tiledObject.height ?? firstFrame.height);

        let xScale = displayWidth / firstFrame.width
        let yScale = displayHeight / firstFrame.height
        
        this.setScale(xScale, yScale);
        // 设置物理碰撞体为原始尺寸的80%
        this.setSize(firstFrame.width * 0.7, firstFrame.height * 0.7);
        // 居中偏移量为原始尺寸的10%
        this.setOffset(firstFrame.width * 0.1, firstFrame.height * 0.1);
        
        // Collide with all world bounds in TopDown game
        this.setCollideWorldBounds(true);
        this.setBounce(0);
        
        // Player should not be pushable by other objects (e.g., movable boxes)
        this.setPushable(false);
        
        this.cursors = scene.input.keyboard!.createCursorKeys();
        
        // Initialize WASD keys
        this.wasdKeys = {
            W: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            A: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            S: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            D: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
        
        this.shootKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.X);
        
        // Initialize aiming system
        this.aimingSystem = AimingSystem.getInstance();
        
        // Play initial animation using AnimationManager
        this.playAnimation('idle');
    }
    
    private parseAbilityProperties(properties: any[]) {
        // Parse each ability from properties
        properties.forEach(prop => {
            switch (prop.name) {
                case 'can_shoot':
                    this.abilities.canShoot = prop.value;
                    break;
                case 'can_move':
                    this.abilities.canMove = prop.value;
                    break;
                case 'move_speed':
                    this.moveSpeed = prop.value;
                    break;
            }
        });
    }

    private playAnimation(animName: string): void {
        const animKey = `${this.key}_${animName}`;
        if (this.currentAnimation !== animKey) {
            this.currentAnimation = animKey;
            
            // Emit animation play event - the AnimationManager will handle the actual animation
            eventBus.emit(GameEvent.ANIMATION_PLAY, {
                sprite: this,
                atlasKey: this.key,
                animationName: animName
            });
        }
    }
    
    setMobileControls(controls: MobileControls): void {
        this.mobileControls = controls;
        
        // Setup shoot callbacks
        controls.setShootCallbacks(
            // On press
            () => {
                this.mobileShootPressed = true;
            },
            // On release
            () => {
                this.mobileShootPressed = false;
            }
        );
    }

    update(): void {
        const velocity = this.body?.velocity;
        if (!velocity) return;
        
        // Check if player is stuck in terrain
        this.checkAndFixStuckInTerrain();
        
        // Update knockback timer
        if (this.knockbackTime > 0) {
            this.knockbackTime -= this.scene.game.loop.delta;
            // During knockback, prevent normal movement
            if (this.knockbackTime > 0) {
                return; // Skip normal movement controls during knockback
            }
        }
        
        // Get mobile input if available
        let mobileX = 0;
        let mobileY = 0;
        if (this.mobileControls) {
            const joystickForce = this.mobileControls.getJoystickForce();
            mobileX = joystickForce.x;
            mobileY = joystickForce.y;
        }
        
        // 8-direction movement (TopDown游戏)
        if (this.abilities.canMove) {
            // Check input for all 4 directions
            const leftPressed = this.cursors.left.isDown || this.wasdKeys.A.isDown || mobileX < -0.3;
            const rightPressed = this.cursors.right.isDown || this.wasdKeys.D.isDown || mobileX > 0.3;
            const upPressed = this.cursors.up.isDown || this.wasdKeys.W.isDown || mobileY < -0.3;
            const downPressed = this.cursors.down.isDown || this.wasdKeys.S.isDown || mobileY > 0.3;
            
            // Calculate movement direction
            let velocityX = 0;
            let velocityY = 0;
            
            if (leftPressed) velocityX = -1;
            else if (rightPressed) velocityX = 1;
            
            if (upPressed) velocityY = -1;
            else if (downPressed) velocityY = 1;
            
            // Apply mobile joystick values if available
            if (mobileX !== 0 || mobileY !== 0) {
                velocityX = mobileX;
                velocityY = mobileY;
            }
            
            // Normalize diagonal movement to prevent faster movement
            const length = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
            if (length > 0) {
                velocityX = (velocityX / length) * this.moveSpeed;
                velocityY = (velocityY / length) * this.moveSpeed;
                
                this.setVelocity(velocityX, velocityY);
                
                // 不在移动时改变翻转，由鼠标瞄准控制
                // Set sprite facing direction is now controlled by mouse aiming
                
                this.playAnimation('walk');
                
                // Emit player move event
                eventBus.emit(GameEvent.PLAYER_MOVE, {
                    player: this,
                    direction: velocityX < 0 ? 'left' : 'right',
                    velocity: this.moveSpeed
                });
            } else {
                // No movement
                this.setVelocity(0, 0);
                this.playAnimation('idle');
                
                // Emit player idle event
                eventBus.emit(GameEvent.PLAYER_IDLE, {
                    player: this
                });
            }
        } else {
            this.setVelocity(0, 0);
            this.playAnimation('idle');
            
            // Emit player idle event
            eventBus.emit(GameEvent.PLAYER_IDLE, {
                player: this
            });
        }
        
        // 鼠标瞄准：让玩家精灵翻转朝向鼠标
        if (this.scene.input.activePointer) {
            this.aimingSystem.flipToPointer(this, this.scene.input.activePointer);
        }
        
        // Shooting (keyboard or mobile or mouse)
        const mouseShoot = this.scene.input.activePointer?.leftButtonDown();
        const shootPressed = Phaser.Input.Keyboard.JustDown(this.shootKey) || 
                            (this.mobileShootPressed && this.mobileControls && this.canShoot) ||
                            mouseShoot;
        if (shootPressed && this.abilities.canShoot && this.canShoot) {
            this.shoot();
        }
    }
    
    private shoot(): void {
        const currentTime = this.scene.time.now;
        if (currentTime - this.lastShootTime < this.shootCooldown) {
            return;
        }
        
        this.lastShootTime = currentTime;
        this.canShoot = false;
        
        // Reset canShoot after cooldown
        this.scene.time.delayedCall(this.shootCooldown, () => {
            this.canShoot = true;
        });
        
        // 获取朝向鼠标的方向向量
        const aimDirection = this.aimingSystem.getDirectionToPointer(this, this.scene.input.activePointer!);
        
        // Calculate bullet spawn position in the aiming direction
        const bulletOffset = 30; // Distance from player center
        const bulletX = this.x + (aimDirection.x * bulletOffset);
        const bulletY = this.y + (aimDirection.y * bulletOffset);
        
        // Pass player's current velocity to the bullet
        const playerVelocity = {
            x: this.body?.velocity.x || 0,
            y: this.body?.velocity.y || 0
        };
        
        // Create bullet with direction vector (aiming to mouse)
        const bullet = new Bullet(
            this.scene, 
            bulletX, 
            bulletY, 
            aimDirection,              // 朝向鼠标的方向向量
            600,                       // Bullet velocity
            false,                     // No gravity for TopDown game
            this, 
            playerVelocity
        );
        
        // Check immediate collision with obstacles after bullet creation
        bullet.setImmediateCollisionCheck(true);
        
        // Notify Game scene about the new bullet
        eventBus.emit(GameEvent.BULLET_CREATED, {
            bullet: bullet,
            owner: this
        });
    
        
        // Apply recoil (push back slightly) - opposite to shooting direction
        const recoilX = -aimDirection.x * 30;
        const recoilY = -aimDirection.y * 30;
        this.setVelocity(
            this.body?.velocity.x! + recoilX,
            this.body?.velocity.y! + recoilY
        );
    }

    takeDamage(damage: number): void {
        if (this.isInvulnerable) {
            return;
        }
        
        this.health -= damage;
        this.isInvulnerable = true;  // Immediately become invulnerable
        
        // Emit player damage event
        eventBus.emit(GameEvent.PLAYER_DAMAGE, {
            player: this,
            damage: damage,
            health: this.health
        });
        
        // Play hit animation
        this.playAnimation('hit');
        
        // Play hit sound effect through event
        eventBus.emit(GameEvent.SOUND_EFFECT_PLAY, {
            key: `${this.key}_hit`,
            atlasKey: this.key,
            animationName: 'hit',
            volume: 0.5
        });
        
        // Apply knockback (push away from damage source)
        const knockbackX = this.flipX ? 150 : -150;
        const knockbackY = -150;
        this.setVelocity(knockbackX, knockbackY);
        
        // Set knockback duration (player can't control movement during this time)
        this.knockbackTime = 300; // 300ms of knockback
        
        // Flash effect for invulnerability
        this.scene.tweens.add({
            targets: this,
            alpha: { from: 1, to: 0.3 },
            duration: 100,
            repeat: 7,
            yoyo: true,
            onComplete: () => {
                this.alpha = 1;
                this.isInvulnerable = false;
            }
        });
        
        if (this.health <= 0) {
            this.handleDeath();
        }
    }

    private handleDeath(): void {
        // Prevent multiple death triggers
        if (this.isDead) return;
        this.isDead = true;
        
        this.setTint(0xff0000);
        this.setVelocity(0, 0);
        this.body!.enable = false;
        
        // Emit player death event
        eventBus.emit(GameEvent.PLAYER_DEATH, {
            player: this
        });
        
        // Play death sound effect through event
        eventBus.emit(GameEvent.SOUND_EFFECT_PLAY, {
            key: `${this.key}_die`,
            atlasKey: this.key,
            animationName: 'die',
            volume: 0.5
        });
        
        // Death animation (fade and scale)
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scale: 0,
            duration: 500,
            ease: 'Power2'
        });
        
        this.scene.time.delayedCall(1000, () => {
            // Emit game over event
            eventBus.emit(GameEvent.GAME_OVER, {
                reason: 'Player died'
            });
            
            // Call Game scene's restartGame method
            const gameScene = this.scene as any;
            if (gameScene.restartGame) {
                gameScene.restartGame();
            } else {
                this.scene.scene.restart();
            }
        });
    }

    getHealth(): number {
        return this.health;
    }

    getMaxHealth(): number {
        return this.maxHealth;
    }
    
    private checkAndFixStuckInTerrain(): void {
        const deltaTime = this.scene.game.loop.delta;
        this.stuckCheckTimer += deltaTime;
        
        // Only check periodically to avoid performance issues
        if (this.stuckCheckTimer < this.stuckCheckInterval) {
            return;
        }
        
        this.stuckCheckTimer = 0;
        
        // Check if player is stuck (overlapping with tilemap)
        const isStuck = this.isStuckInTerrain();
        
        if (isStuck) {
            // Start floating up
            if (!this.isFloatingUp) {
                console.log('Player stuck in terrain! Floating up...');
                this.isFloatingUp = true;
            }
            // Apply upward velocity to float out
            this.setVelocityY(this.floatUpSpeed);
        } else {
            // Not stuck anymore, stop floating
            if (this.isFloatingUp) {
                console.log('Player unstuck!');
                this.isFloatingUp = false;
            }
        }
    }
    
    private isStuckInTerrain(): boolean {
        const gameScene = this.scene as any;
        if (!gameScene.layers) return false;
        
        // Check if player center is inside any collision tile
        for (const layer of gameScene.layers) {
            const tile = layer.getTileAtWorldXY(this.x, this.y);
            if (tile && tile.collides) {
                return true;
            }
        }
        
        return false;
    }
}