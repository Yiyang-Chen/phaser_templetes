import { Scene } from 'phaser';
import { ConfigManager } from '../config/ConfigManager';

export type EnemyType = 'flying_creature' | 'goblin' | 'slime';

export class BattleEnemy extends Phaser.Physics.Arcade.Sprite {
    private enemyType: EnemyType;
    private moveSpeed: number;
    private baseMoveSpeed: number; // 基础移动速度
    private difficultyMultiplier: number = 1.0; // 难度倍数
    private health: number;
    private maxHealth: number;
    private damage: number;
    private player: Phaser.Physics.Arcade.Sprite | null = null;
    private isDestroyed: boolean = false;
    private configManager: ConfigManager;
    
    constructor(scene: Scene, x: number, y: number, enemyType: EnemyType) {
        super(scene, x, y, enemyType);
        
        this.enemyType = enemyType;
        this.configManager = ConfigManager.getInstance();
        
        // 根据敌人类型设置属性
        this.setupEnemyStats();
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // 使用统一配置设置敌人属性
        this.setupEnemyFromConfig();
        
        // 播放移动动画
        this.play(`${enemyType}_move`);
        

    }
    
    private setupEnemyStats(): void {
        switch (this.enemyType) {
            case 'flying_creature':
                this.baseMoveSpeed = 80; // 降低初始速度
                this.health = 2;
                this.damage = 1;
                break;
            case 'goblin':
                this.baseMoveSpeed = 100; // 降低初始速度
                this.health = 3;
                this.damage = 2;
                break;
            case 'slime':
                this.baseMoveSpeed = 60; // 降低初始速度
                this.health = 1;
                this.damage = 1;
                break;
        }
        this.moveSpeed = this.baseMoveSpeed;
        this.maxHealth = this.health;
    }
    
    private setupEnemyFromConfig(): void {
        const enemyConfig = this.configManager.getEnemyStandardConfig();
        
        // 设置物理属性
        this.setCollideWorldBounds(true);
        this.setBounce(0.2);
        
        // 使用统一配置设置碰撞体积
        const collisionWidth = enemyConfig.baseSize.width * enemyConfig.collisionScale;
        const collisionHeight = enemyConfig.baseSize.height * enemyConfig.collisionScale;
        this.setSize(collisionWidth, collisionHeight);
        
        // 计算偏移量以居中碰撞体
        const offsetX = (enemyConfig.baseSize.width - collisionWidth) / 2;
        const offsetY = (enemyConfig.baseSize.height - collisionHeight) / 2;
        this.setOffset(offsetX, offsetY);
        
        // 使用统一配置设置缩放和深度
        this.setScale(enemyConfig.scale);
        this.setDepth(enemyConfig.zDepth);
    }
    
    setPlayer(player: Phaser.Physics.Arcade.Sprite): void {
        this.player = player;
    }
    
    setDifficultyMultiplier(multiplier: number): void {
        this.difficultyMultiplier = multiplier;
        this.moveSpeed = this.baseMoveSpeed * multiplier;
    }
    
    update(): void {
        if (this.isDestroyed || !this.player) return;
        
        // 计算朝向玩家的方向
        const deltaX = this.player.x - this.x;
        const deltaY = this.player.y - this.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // 增加追踪距离，让怪物更积极地追踪玩家
        if (distance > 1000) { // 从600增加到1000
            this.setVelocity(0, 0);
            return;
        }
        
        // 标准化方向向量
        const directionX = deltaX / distance;
        const directionY = deltaY / distance;
        
        // 设置移动速度，如果距离很近则稍微加速
        let currentSpeed = this.moveSpeed;
        if (distance < 200) {
            currentSpeed = this.moveSpeed * 1.2; // 接近玩家时加速20%
        }
        
        this.setVelocity(
            directionX * currentSpeed,
            directionY * currentSpeed
        );
        
        // 设置朝向（左右翻转）
        if (deltaX < 0) {
            this.setFlipX(true);
        } else {
            this.setFlipX(false);
        }
        
        // 注意：已移除重力系统，所有敌人都采用顶视角移动
    }
    
    takeDamage(damage: number = 1): void {
        if (this.isDestroyed) return;
        
        this.health -= damage;
        
        // 闪烁效果表示受伤
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            if (!this.isDestroyed) {
                this.clearTint();
            }
        });
        

        
        // 检查是否死亡
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die(): void {
        if (this.isDestroyed) return;
        
        this.isDestroyed = true;
        
        // 创建死亡效果
        this.createDeathEffect();
        

        
        // 销毁敌人
        this.destroy();
    }
    
    private createDeathEffect(): void {
        // 创建简单的粒子爆炸效果
        const particles = this.scene.add.particles(this.x, this.y, 'bullet', {
            speed: { min: 50, max: 150 },
            scale: { start: 0.3, end: 0 },
            lifespan: 300,
            quantity: 8,
            tint: this.getDeathColor()
        });
        
        // 清理粒子效果
        this.scene.time.delayedCall(500, () => {
            particles.destroy();
        });
    }
    
    private getDeathColor(): number {
        switch (this.enemyType) {
            case 'flying_creature': return 0x00ff00; // 绿色
            case 'goblin': return 0xff0000;         // 红色
            case 'slime': return 0x00ffff;          // 青色
            default: return 0xffffff;               // 白色
        }
    }
    
    getDamage(): number {
        return this.damage;
    }
    
    getHealth(): number {
        return this.health;
    }
    
    getMaxHealth(): number {
        return this.maxHealth;
    }
    
    getEnemyType(): EnemyType {
        return this.enemyType;
    }
}
