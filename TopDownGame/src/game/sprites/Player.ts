import { AnimationManager } from '../managers/AnimationManager';
import { Weapon } from './Weapon';
import { InputManager } from '../managers/InputManager';
import { ConfigManager } from '../config/ConfigManager';
import { SafetyUtils } from '../utils/SafetyUtils';
import type { IPlayer, IWeapon } from '../types/GameTypes';

export class Player extends Phaser.Physics.Arcade.Sprite implements IPlayer {
    declare body: Phaser.Physics.Arcade.Body;
    private moveSpeed: number;
    private currentAnimation: string = '';
    private key: string = '';
    
    // Health and damage
    private health: number;
    private maxHealth: number;
    private isInvulnerable: boolean = false;
    
    // Managers
    private animationManager: AnimationManager;
    private inputManager: InputManager;
    private configManager: ConfigManager;
    
    // Movement state
    private isMoving: boolean = false;
    private lastDirection: string = 'down';
    
    // Weapon system
    private weapon: Weapon;

    constructor(scene: Phaser.Scene, tiledObject: Phaser.Types.Tilemaps.TiledObject) {
        const x = tiledObject.x ?? 0;
        const y = tiledObject.y ?? 0;
        const key = tiledObject.name;

        super(scene, x, y, key);

        // 初始化管理器和配置
        this.configManager = ConfigManager.getInstance();
        this.animationManager = AnimationManager.getInstance();
        this.inputManager = new InputManager(scene);
        
        this.key = key;
        this.setupFromConfig();

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setupPhysicsAndDisplay();
        
        // 创建随机武器
        this.weapon = new Weapon(scene, x, y, 'random');
        
        // 使用安全的延迟动画播放
        SafetyUtils.delayedExecution(
            this.scene,
            () => this.scene.anims && this.scene.anims.exists('knight_idle'),
            () => this.playAnimation('idle'),
            10,
            100
        );
    }
    
    private setupFromConfig(): void {
        const playerConfig = this.configManager.getPlayerConfig();
        this.moveSpeed = playerConfig.moveSpeed;
        this.health = playerConfig.health;
        this.maxHealth = playerConfig.maxHealth;
    }
    
    private setupPhysicsAndDisplay(): void {
        const playerStandardConfig = this.configManager.getPlayerStandardConfig();
        const physicsConfig = this.configManager.getPhysicsConfig();

        // 使用统一标准配置设置缩放
        this.setScale(playerStandardConfig.scale);
        this.setDepth(playerStandardConfig.zDepth);
        
        // 使用统一标准配置设置碰撞体
        const collisionWidth = playerStandardConfig.baseSize.width * playerStandardConfig.collisionScale;
        const collisionHeight = playerStandardConfig.baseSize.height * playerStandardConfig.collisionScale;
        this.setSize(collisionWidth, collisionHeight);
        
        // 计算偏移量以居中碰撞体
        const offsetX = (playerStandardConfig.baseSize.width - collisionWidth) / 2;
        const offsetY = (playerStandardConfig.baseSize.height - collisionHeight) / 2;
        this.setOffset(offsetX, offsetY);
        
        this.setCollideWorldBounds(true);
        this.setBounce(physicsConfig.bounce);
    }

    private playAnimation(animName: string): void {
        // 对于骑士精灵，直接使用预定义的动画键
        if (this.key === 'knight_idle') {
            let animKey = '';
            if (animName === 'idle') {
                animKey = 'knight_idle';
            } else if (animName === 'run') {
                animKey = 'knight_run';
            } else {
                animKey = 'knight_idle'; // 默认使用待机动画
            }
            
            // 使用安全的动画播放
            if (this.currentAnimation !== animKey) {
                const success = SafetyUtils.safePlayAnimation(this, animKey, this.scene, 'knight_idle');
                if (success) {
                    this.currentAnimation = animKey;
                }
            }
        } else {
            // 原有的动画系统
            const animKey = this.animationManager.getAnimationKey(this.key, animName);
            console.log(`Trying to play animation: ${animKey}`);
            console.log(`Animation exists:`, this.animationManager.hasAnimation(this.key, animName));
            
            if (this.animationManager.hasAnimation(this.key, animName)) {
                if (this.currentAnimation !== animKey) {
                    console.log(`Playing animation: ${animKey}`);
                    this.play(animKey);
                    this.currentAnimation = animKey;
                }
            } else {
                console.warn(`Animation ${animKey} not found. Available animations:`, this.animationManager.getAtlasAnimations(this.key));
                // 回退：尝试使用walk动画
                const fallbackAnimKey = this.animationManager.getAnimationKey(this.key, 'walk');
                if (this.animationManager.hasAnimation(this.key, 'walk')) {
                    console.log(`Using fallback animation: ${fallbackAnimKey}`);
                    this.play(fallbackAnimKey);
                    this.currentAnimation = fallbackAnimKey;
                }
            }
        }
    }

    update(): void {
        if (!this.body?.velocity) return;

        // 更新输入管理器
        this.inputManager.update();
        
        this.handleMovement();
        this.handleWeapon();
    }
    
    private handleMovement(): void {
        const inputState = this.inputManager.getInputState();
        const movement = inputState.movement;
        
        // 设置速度
        this.setVelocityX(movement.direction.x * this.moveSpeed);
        this.setVelocityY(movement.direction.y * this.moveSpeed);
        
        // 更新移动状态
        this.isMoving = movement.isMoving;
        
        if (this.isMoving) {
            this.playAnimation('run');
            this.updateDirection(movement.direction);
        } else {
            this.playAnimation('idle');
        }
    }
    
    private updateDirection(direction: { x: number; y: number }): void {
        // 更新主要朝向
        if (Math.abs(direction.y) > Math.abs(direction.x)) {
            this.lastDirection = direction.y > 0 ? 'down' : 'up';
        } else {
            this.lastDirection = direction.x > 0 ? 'right' : 'left';
        }
        
        // 设置精灵朝向
        if (this.lastDirection === 'left') {
            this.setFlipX(true);
        } else if (this.lastDirection === 'right') {
            this.setFlipX(false);
        }
    }
    
    private handleWeapon(): void {
        if (!this.weapon) return;
        
        const mousePos = this.inputManager.getMouseWorldPosition();
        
        // 更新武器位置和朝向
        this.weapon.update(this.x, this.y, this.lastDirection, this.isMoving, mousePos.x, mousePos.y);
        
        // 处理武器切换
        if (this.inputManager.isWeaponSwitchPrevPressed()) {
            this.weapon.switchToPreviousWeapon();
        }
        if (this.inputManager.isWeaponSwitchNextPressed()) {
            this.weapon.switchToNextWeapon();
        }
        
        // 处理射击
        if (this.inputManager.isShootingKeyboard()) {
            if (this.weapon.isWeaponReady()) {
                this.weapon.shoot(); // 朝向当前方向射击
            }
        } else if (this.inputManager.isShootingMouse()) {
            if (this.weapon.isWeaponReady()) {
                this.weapon.shoot(mousePos.x, mousePos.y); // 朝向鼠标射击
            }
        }
    }
    


    hit(): void {
        this.playAnimation('hit');
        
        this.scene.time.delayedCall(500, () => {
            if (this.isMoving) {
                this.playAnimation('run');
            } else {
                this.playAnimation('idle');
            }
        });
    }

    takeDamage(damage: number): void {
        if (this.isInvulnerable) {
            return;
        }
        
        this.health -= damage;
        this.isInvulnerable = true;
        
        this.playAnimation('hit');
        
        // 使用配置文件中的击退力度
        const playerConfig = this.configManager.getPlayerConfig();
        const knockbackX = this.flipX ? -playerConfig.knockbackForce.x : playerConfig.knockbackForce.x;
        const knockbackY = playerConfig.knockbackForce.y;
        this.setVelocity(knockbackX, knockbackY);
        
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
        this.setTint(0xff0000);
        this.setVelocity(0, 0);
        this.body!.enable = false;
        
        this.scene.time.delayedCall(1000, () => {
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
    
    isPlayerMoving(): boolean {
        return this.isMoving;
    }
    
    getLastDirection(): string {
        return this.lastDirection;
    }
    
    getWeapon(): IWeapon {
        return this.weapon;
    }
    
    isShooting(): boolean {
        return this.weapon ? !this.weapon.isWeaponReady() : false;
    }
    
    getInputManager(): InputManager {
        return this.inputManager;
    }
    
    // 清理资源
    destroy(): void {
        if (this.inputManager) {
            this.inputManager.destroy();
        }
        super.destroy();
    }
}