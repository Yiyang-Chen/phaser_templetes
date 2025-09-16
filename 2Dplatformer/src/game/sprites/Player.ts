import Phaser from 'phaser';
import { eventBus, GameEvent } from '../events/EventBus';
import { Bullet } from './Bullet';
import { MobileControls } from '../ui/MobileControls';

interface PlayerAbilities {
    canJump: boolean;
    canDoubleJump: boolean;
    canWallJump: boolean;
    canWallSlide: boolean;
    canChargeJump: boolean;
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
        canChargeJump: true,
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
    
    // Charge jump
    private isCharging: boolean = false;
    private chargeTime: number = 0;
    private maxChargeTime: number = 1000;
    private minChargeTime: number = 200;
    private chargeJumpMultiplier: number = 2;
    
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
    private bullets: Phaser.Physics.Arcade.Group;
    
    // Mobile controls
    private mobileControls: MobileControls | null = null;
    private mobileJumpPressed: boolean = false;
    private mobileShootPressed: boolean = false;
    private mobileJumpJustPressed: boolean = false;
    private mobileJumpJustReleased: boolean = false;

    constructor(scene: Phaser.Scene, tiledObject: Phaser.Types.Tilemaps.TiledObject) {
        let x = tiledObject.x ?? 0;
        let y = tiledObject.y ?? 0;

        let key = tiledObject.name;

        super(scene, x, y, key);

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
        
        this.bullets = scene.physics.add.group({
            classType: Bullet,
            runChildUpdate: true,
            maxSize: 10
        });
        
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
                case 'can_charge_jump':
                    this.abilities.canChargeJump = prop.value;
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
            (duration: number) => {
                this.mobileJumpPressed = false;
                this.mobileJumpJustReleased = true;
            },
            // On hold (for charge indicator)
            (duration: number) => {
                // Charging feedback handled in update
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
            
            if (onGround && !this.cursors.down.isDown && !this.wasdKeys.S.isDown && !this.isCharging) {
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
        
        // Check if either jump key is pressed (keyboard or mobile)
        const jumpKeyPressed = spaceKey?.isDown || upKey.isDown || wKey.isDown || this.mobileJumpPressed;
        const jumpKeyJustPressed = Phaser.Input.Keyboard.JustDown(spaceKey!) || Phaser.Input.Keyboard.JustDown(upKey) || 
                                  Phaser.Input.Keyboard.JustDown(wKey) || this.mobileJumpJustPressed;
        const jumpKeyJustReleased = Phaser.Input.Keyboard.JustUp(spaceKey!) || Phaser.Input.Keyboard.JustUp(upKey) || 
                                   Phaser.Input.Keyboard.JustUp(wKey) || this.mobileJumpJustReleased;
        
        // Handle jump logic
        if (jumpKeyJustPressed && !this.isCharging) {
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
            // Check if we should start charging (ducking + jump for both mobile and keyboard)
            else if (onGround && isDucking && this.abilities.canChargeJump) {
                // Start charging when ducking
                this.isCharging = true;
                this.chargeTime = 0;
                this.playAnimation('duck');
            }
            // Normal jump (not ducking)
            else if (onGround && !isDucking && this.jumpCount < this.maxJumps && this.abilities.canJump) {
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
        
        // Continue charging if jump key is held while ducking
        if (this.isCharging && jumpKeyPressed && isDucking) {
            this.chargeTime += this.scene.game.loop.delta;
            if (this.chargeTime > this.maxChargeTime) {
                this.chargeTime = this.maxChargeTime;
            }
            
            // Visual feedback for charging (tint color based on charge level)
            const chargePercent = this.chargeTime / this.maxChargeTime;
            const tintValue = 0xffffff - Math.floor(chargePercent * 0x008888);
            this.setTint(tintValue);
            
            // Update jump button visual for mobile
            if (this.mobileControls) {
                this.mobileControls.updateJumpButtonProgress(chargePercent);
            }
            
            // Keep showing duck animation if ducking
            if (isDucking && this.anims.currentAnim?.key !== 'duck') {
                this.playAnimation('duck');
            }
        }
        
        // Cancel charging if not ducking anymore or left ground
        if (this.isCharging && (!isDucking || !onGround)) {
            // If we have enough charge and released jump key, perform charged jump
            if (!jumpKeyPressed && this.chargeTime >= this.minChargeTime) {
                const chargeMultiplier = 1 + (this.chargeTime / this.maxChargeTime) * (this.chargeJumpMultiplier - 1);
                const jumpVelocity = -this.jumpSpeed * chargeMultiplier;
                this.setVelocityY(jumpVelocity);
                this.jumpCount = 1;
                
                // Emit charge jump event
                eventBus.emit(GameEvent.PLAYER_CHARGE_JUMP, {
                    player: this,
                    chargeTime: this.chargeTime,
                    velocity: jumpVelocity
                });
                
                this.playAnimation('jump');
            }
            
            // Clear charging state
            this.isCharging = false;
            this.chargeTime = 0;
            this.clearTint();
            
            // Reset button visual for mobile
            if (this.mobileControls) {
                this.mobileControls.updateJumpButtonProgress(0);
            }
        }
        
        // Release charged jump when releasing jump key while charging
        if (jumpKeyJustReleased && this.isCharging && isDucking) {
            if (this.chargeTime >= this.minChargeTime) {
                const chargeMultiplier = 1 + (this.chargeTime / this.maxChargeTime) * (this.chargeJumpMultiplier - 1);
                const jumpVelocity = -this.jumpSpeed * chargeMultiplier;
                this.setVelocityY(jumpVelocity);
                this.jumpCount = 1;
                
                // Emit charge jump event
                eventBus.emit(GameEvent.PLAYER_CHARGE_JUMP, {
                    player: this,
                    chargeTime: this.chargeTime,
                    velocity: jumpVelocity
                });
                
                this.playAnimation('jump');
            }
            
            this.isCharging = false;
            this.chargeTime = 0;
            this.clearTint();
            
            // Reset button visual for mobile
            if (this.mobileControls) {
                this.mobileControls.updateJumpButtonProgress(0);
            }
        }
        
        // Show duck animation when ducking and not charging
        if (isDucking && !this.isCharging) {
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
        this.mobileJumpJustReleased = false;
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
        
        const bullet = new Bullet(this.scene, bulletX, bulletY, direction, playerVelocity);
        this.bullets.add(bullet);
        
        // Check immediate collision with obstacles after bullet creation
        bullet.setImmediateCollisionCheck(true);
        
        eventBus.emit(GameEvent.SOUND_EFFECT_PLAY, {
            key: 'player_shoot',
            volume: 0.3
        });
        
        this.setVelocityX(this.body?.velocity.x! - (direction * 50));
    }
    
    getBullets(): Phaser.Physics.Arcade.Group {
        return this.bullets;
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