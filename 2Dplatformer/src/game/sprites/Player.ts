import Phaser from 'phaser';
import { eventBus, GameEvent } from '../events/EventBus';
import { Bullet } from './Bullet';
import { MobileControls } from '../ui/MobileControls';

interface PlayerAbilities {
    canJump: boolean;
    canDoubleJump: boolean;
    canWallJump: boolean;
    canWallSlide: boolean;
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
    private jumpSpeed: number = 500;
    private currentAnimation: string = '';
    private key: string = '';
    
    // Ability configuration
    private abilities: PlayerAbilities = {
        canJump: true,
        canDoubleJump: true,
        canWallJump: true,
        canWallSlide: true,
        canShoot: true,
        canMove: true
    };
    
    // Double jump
    private jumpCount: number = 0;
    private maxJumps: number = 2;
    
    // Wall jump
    private isTouchingWall: boolean = false;
    private wallJumpCooldown: number = 0;
    private wallJumpSpeed: number = 400;
    
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
    private mobileJumpPressed: boolean = false;
    private mobileShootPressed: boolean = false;
    private mobileJumpJustPressed: boolean = false;

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
        
        // Only collide with horizontal world bounds, not vertical
        this.setCollideWorldBounds(false);
        this.setBounce(0.1);
        this.setGravityY(800);
        
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
        
        // Play initial animation using AnimationManager
        this.playAnimation('idle');
    }
    
    private parseAbilityProperties(properties: any[]) {
        // Parse each ability from properties
        properties.forEach(prop => {
            switch (prop.name) {
                case 'can_jump':
                    this.abilities.canJump = prop.value;
                    break;
                case 'can_double_jump':
                    this.abilities.canDoubleJump = prop.value;
                    if (!prop.value) {
                        this.maxJumps = 1; // Disable double jump
                    }
                    break;
                case 'can_wall_jump':
                    this.abilities.canWallJump = prop.value;
                    break;
                case 'can_wall_slide':
                    this.abilities.canWallSlide = prop.value;
                    break;
                case 'can_shoot':
                    this.abilities.canShoot = prop.value;
                    break;
                case 'can_move':
                    this.abilities.canMove = prop.value;
                    break;
                // Additional ability parameters
                case 'move_speed':
                    this.moveSpeed = prop.value;
                    break;
                case 'jump_speed':
                    this.jumpSpeed = prop.value;
                    break;
                case 'max_jumps':
                    this.maxJumps = prop.value;
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
        
        // Setup jump callbacks
        controls.setJumpCallbacks(
            // On press
            () => {
                if (!this.mobileJumpPressed) {
                    this.mobileJumpJustPressed = true;
                    this.mobileJumpPressed = true;
                }
            },
            // On release
            (_duration: number) => {
                this.mobileJumpPressed = false;
            },
            // On hold
            (_duration: number) => {
                // No action needed
            }
        );
        
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
        
        // Manual world bounds check
        const worldBounds = this.scene.physics.world.bounds;
        
        // Keep player within horizontal bounds only
        // Use the actual physics body size for more accurate boundary detection
        const bodyWidth = this.body?.width || this.width;
        const bodyOffset = this.body?.offset.x || 0;
        const leftEdge = this.x - this.displayOriginX + bodyOffset;
        const rightEdge = leftEdge + bodyWidth;
        
        if (leftEdge < worldBounds.left) {
            this.x = worldBounds.left - bodyOffset + this.displayOriginX;
            this.setVelocityX(Math.max(0, this.body?.velocity.x || 0));
        } else if (rightEdge > worldBounds.right) {
            this.x = worldBounds.right - bodyWidth - bodyOffset + this.displayOriginX;
            this.setVelocityX(Math.min(0, this.body?.velocity.x || 0));
        }
        
        // Check if player falls below the bottom boundary - trigger death
        if (this.y > worldBounds.bottom + this.height) {
            if (!this.isDead) { // Prevent multiple death triggers
                this.handleDeath();
                return;
            }
        }

        // Check if player is stuck in terrain
        this.checkAndFixStuckInTerrain();

        const onGround = this.body?.blocked.down || false;
        const touchingLeft = this.body?.blocked.left || false;
        const touchingRight = this.body?.blocked.right || false;
        
        // Update wall touching status
        this.isTouchingWall = !onGround && (touchingLeft || touchingRight);
        
        // Update wall jump cooldown
        if (this.wallJumpCooldown > 0) {
            this.wallJumpCooldown -= this.scene.game.loop.delta;
        }
        
        // Update knockback timer
        if (this.knockbackTime > 0) {
            this.knockbackTime -= this.scene.game.loop.delta;
            // During knockback, prevent normal movement
            if (this.knockbackTime > 0) {
                return; // Skip normal movement controls during knockback
            }
        }
        
        // Reset jump count when on ground
        if (onGround) {
            this.jumpCount = 0;
        }
        
        // Get mobile input if available
        let mobileX = 0;
        let mobileY = 0;
        if (this.mobileControls) {
            const joystickForce = this.mobileControls.getJoystickForce();
            mobileX = joystickForce.x;
            mobileY = joystickForce.y;
        }
        
        // Horizontal movement (keyboard or mobile)
        if (this.abilities.canMove) {
            const leftPressed = this.cursors.left.isDown || this.wasdKeys.A.isDown || mobileX < -0.3;
            const rightPressed = this.cursors.right.isDown || this.wasdKeys.D.isDown || mobileX > 0.3;
            
            if (leftPressed) {
                this.setVelocityX(-this.moveSpeed * (mobileX !== 0 ? Math.abs(mobileX) : 1));
                this.setFlipX(true);
                
                if (onGround) {
                    this.playAnimation('walk');
                }
                
                // Emit player move event
                eventBus.emit(GameEvent.PLAYER_MOVE, {
                    player: this,
                    direction: 'left',
                    velocity: -this.moveSpeed
                });
            } else if (rightPressed) {
                this.setVelocityX(this.moveSpeed * (mobileX !== 0 ? Math.abs(mobileX) : 1));
                this.setFlipX(false);
                
                if (onGround) {
                    this.playAnimation('walk');
                }
                
                // Emit player move event
                eventBus.emit(GameEvent.PLAYER_MOVE, {
                    player: this,
                    direction: 'right',
                    velocity: this.moveSpeed
                });
            } else {
                this.setVelocityX(0);
                if (onGround) {
                    this.playAnimation('idle');
                }
            }
        } else {
            this.setVelocityX(0);
            
            if (onGround && !this.cursors.down.isDown && !this.wasdKeys.S.isDown) {
                this.playAnimation('idle');
                
                // Emit player idle event
                eventBus.emit(GameEvent.PLAYER_IDLE, {
                    player: this
                });
            }
        }
        
        // Duck state (keyboard or mobile joystick down)
        const isDucking = (this.cursors.down.isDown || this.wasdKeys.S.isDown || mobileY > 0.5) && onGround;
        
        // Jump keys setup
        const spaceKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        const upKey = this.cursors.up;
        const wKey = this.wasdKeys.W;
        
        // Check if jump key is just pressed (keyboard or mobile)
        const jumpKeyJustPressed = Phaser.Input.Keyboard.JustDown(spaceKey!) || Phaser.Input.Keyboard.JustDown(upKey) || 
                                  Phaser.Input.Keyboard.JustDown(wKey) || this.mobileJumpJustPressed;
        
        // Handle jump logic
        if (jumpKeyJustPressed) {
            // Wall jump
            if (this.isTouchingWall && this.wallJumpCooldown <= 0 && this.abilities.canWallJump) {
                const wallJumpX = touchingLeft ? this.wallJumpSpeed : -this.wallJumpSpeed;
                this.setVelocityX(wallJumpX);
                this.setVelocityY(-this.jumpSpeed * 0.9);
                this.wallJumpCooldown = 300;
                this.jumpCount = 1;
                this.playAnimation('jump');
                
                // Emit wall jump event
                eventBus.emit(GameEvent.PLAYER_WALL_JUMP, {
                    player: this,
                    direction: touchingLeft ? 'right' : 'left'
                });
            }
            // Double jump (in air)
            else if (!onGround && this.jumpCount < this.maxJumps && this.abilities.canDoubleJump) {
                const jumpPower = this.jumpSpeed * 0.85;
                this.setVelocityY(-jumpPower);
                
                eventBus.emit(GameEvent.PLAYER_DOUBLE_JUMP, {
                    player: this,
                    jumpCount: this.jumpCount + 1
                });
                
                this.jumpCount++;
                this.playAnimation('jump');
            }
            // Normal jump
            else if (onGround && this.jumpCount < this.maxJumps && this.abilities.canJump) {
                const jumpPower = this.jumpSpeed;
                this.setVelocityY(-jumpPower);
                
                eventBus.emit(GameEvent.PLAYER_JUMP, {
                    player: this,
                    velocity: -jumpPower
                });
                
                this.jumpCount++;
                this.playAnimation('jump');
            }
        }
        
        // Show duck animation when ducking
        if (isDucking) {
            this.playAnimation('duck');
        }
        
        // Wall slide effect
        if (this.isTouchingWall && velocity.y > 0) {
            this.setVelocityY(Math.min(velocity.y, 100));
            this.playAnimation('climb');
        }
        
        // Jump animation
        if (!onGround && !this.isTouchingWall) {
            this.playAnimation('jump');
        }
        
        // Shooting (keyboard or mobile)
        const shootPressed = Phaser.Input.Keyboard.JustDown(this.shootKey) || 
                            (this.mobileShootPressed && this.mobileControls && this.canShoot);
        if (shootPressed && this.abilities.canShoot && this.canShoot) {
            this.shoot();
        }
        
        // Reset mobile input flags at end of frame
        this.mobileJumpJustPressed = false;
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
        
        const direction = this.flipX ? -1 : 1;
        
        // Calculate bullet spawn position based on player's body bounds
        const bulletOffset = 25; // Distance from player center
        
        // Use player's body edge as reference point
        const bulletX = this.x + (direction * bulletOffset);
        const bulletY = this.y - 5; // Slightly above center to avoid ground collision
        
        // Pass player's current velocity to the bullet
        const playerVelocity = {
            x: this.body?.velocity.x || 0,
            y: this.body?.velocity.y || 0
        };
        
        // Create bullet and emit event for Game scene to handle
        const bullet = new Bullet(this.scene, bulletX, bulletY, direction, this, playerVelocity);
        
        // Check immediate collision with obstacles after bullet creation
        bullet.setImmediateCollisionCheck(true);
        
        // Notify Game scene about the new bullet
        eventBus.emit(GameEvent.BULLET_CREATED, {
            bullet: bullet,
            owner: this
        });
        
        eventBus.emit(GameEvent.SOUND_EFFECT_PLAY, {
            key: 'player_shoot',
            volume: 0.3
        });
        
        this.setVelocityX(this.body?.velocity.x! - (direction * 50));
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
        
        // Apply knockback based on whether player is on ground
        const onGround = this.body?.blocked.down || false;
        
        if (onGround) {
            // On ground: push back horizontally
            const knockbackX = this.flipX ? 100 : -100;
            this.setVelocityX(knockbackX);
        } else {
            // In air: jump straight up
            this.setVelocityY(-400);
        }
        
        // Set knockback duration (player can't control movement during this time)
        this.knockbackTime = 400; // 400ms of knockback
        
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
        this.setVelocity(0, -400);
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