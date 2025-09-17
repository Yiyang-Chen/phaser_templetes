import { Scene } from 'phaser';
import { ObjectPoolManager } from '../managers/ObjectPoolManager';
import { ConfigManager } from '../config/ConfigManager';

export class OptimizedBullet extends Phaser.Physics.Arcade.Sprite {
    private static readonly POOL_KEY = 'bullets';
    private static readonly DEFAULT_SPEED = 400;
    private static readonly DEFAULT_LIFETIME = 3000;
    
    private speed: number = OptimizedBullet.DEFAULT_SPEED;
    private direction: Phaser.Math.Vector2;
    private bulletType: string;
    private lifeTimer: Phaser.Time.TimerEvent | null = null;
    private isInitialized: boolean = false;
    private configManager: ConfigManager;
    
    constructor(scene: Scene, x: number = 0, y: number = 0) {
        // 使用默认纹理创建，后续会通过reset方法设置具体纹理
        // 使用bullets1作为默认纹理，因为它总是被加载
        super(scene, x, y, 'bullets1');
        
        this.direction = new Phaser.Math.Vector2(0, 0);
        this.bulletType = 'bullets1';
        this.configManager = ConfigManager.getInstance();
        
        // 只在第一次创建时进行场景添加
        if (!this.isInitialized) {
            scene.add.existing(this);
            scene.physics.add.existing(this);
            this.isInitialized = true;
        }
        
        this.setupPhysics();
        this.setupFromConfig();
    }
    
    private setupPhysics(): void {
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.setBounce(0);
            body.setCollideWorldBounds(false);
            // 注意：已移除重力系统，无需特殊设置
        }
    }
    
    private setupFromConfig(): void {
        const bulletStandardConfig = this.configManager.getBulletStandardConfig();
        const bulletConfig = this.configManager.getBulletConfig();
        
        // 使用统一标准配置设置子弹属性
        this.setScale(bulletStandardConfig.scale);
        this.setDepth(bulletStandardConfig.zDepth);
        
        // 使用配置中的速度而不是硬编码
        this.speed = bulletConfig.speed;
    }
    
    /**
     * 重置子弹状态并配置新的发射参数
     */
    reset(x: number, y: number, direction: Phaser.Math.Vector2, bulletType: string = 'bullets1'): void {
        // 确保scene完全可用
        if (!this.scene || !this.scene.textures || !this.scene.time) {
            console.warn('Scene not ready for bullet reset, deferring activation');
            // 延迟激活，直到scene准备好
            setTimeout(() => {
                if (this.scene && this.scene.textures && this.scene.time) {
                    this.reset(x, y, direction, bulletType);
                }
            }, 50);
            return;
        }
        
        this.setPosition(x, y);
        this.direction = direction.clone().normalize();
        this.bulletType = bulletType;
        
        // 设置纹理和外观
        this.setupAppearance();
        
        // 设置物理速度
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.setVelocity(
                this.direction.x * this.speed,
                this.direction.y * this.speed
            );
        }
        
        // 设置生存时间
        this.setupLifetime();
        
        this.setActive(true).setVisible(true);
    }
    
    private setupAppearance(): void {
        // 确保scene和textures存在
        if (!this.scene || !this.scene.textures) {
            // 跳过设置，子弹将使用默认外观
            console.warn('Scene or textures not available for bullet setup, using defaults');
            return;
        }
        
        // 根据子弹类型设置纹理和外观
        if (this.scene.textures.exists(this.bulletType)) {
            this.setTexture(this.bulletType);
            this.setDisplaySize(32, 32);
            this.setSize(16, 16);
            (this.body as Phaser.Physics.Arcade.Body)?.setCircle(8);
        } else {
            // 使用默认子弹纹理bullets1
            console.warn(`Bullet texture '${this.bulletType}' not found, using bullets1`);
            if (this.scene.textures.exists('bullets1')) {
                this.setTexture('bullets1');
                this.setDisplaySize(32, 32);
                this.setSize(16, 16);
                (this.body as Phaser.Physics.Arcade.Body)?.setCircle(8);
            } else {
                // 最后的备选方案：创建一个简单的圆形图形
                console.error('No bullet textures available, creating fallback graphics');
                this.setDisplaySize(8, 8);
                this.setSize(6, 6);
                (this.body as Phaser.Physics.Arcade.Body)?.setCircle(3);
            }
            this.setTint(0xffff00);
        }
        
        this.setOrigin(0.5, 0.5);
        this.setDepth(8);
    }
    
    private setupLifetime(): void {
        // 清除之前的计时器
        if (this.lifeTimer) {
            this.lifeTimer.remove();
            this.lifeTimer = null;
        }
        
        // 确保scene和time存在
        if (!this.scene || !this.scene.time) {
            // 跳过设置生存时间，子弹将永久存在直到手动清理
            console.warn('Scene or time not available for bullet lifetime setup');
            return;
        }
        
        // 设置新的生存时间
        const bulletConfig = this.configManager.getBulletConfig();
        this.lifeTimer = this.scene.time.delayedCall(bulletConfig.lifetime, () => {
            this.deactivate();
        });
    }
    
    update(): void {
        if (!this.active) return;
        
        // 确保scene存在
        if (!this.scene || !this.scene.cameras) {
            return;
        }
        
        // 简化的边界检查
        const camera = this.scene.cameras.main;
        const bounds = camera.getBounds();
        const margin = 100;
        
        if (this.x < bounds.left - margin || this.x > bounds.right + margin || 
            this.y < bounds.top - margin || this.y > bounds.bottom + margin) {
            this.deactivate();
            return;
        }
        
        // 简化的速度检查，只在必要时重新设置速度
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body && Math.abs(body.velocity.x) < 10 && Math.abs(body.velocity.y) < 10) {
            body.setVelocity(
                this.direction.x * this.speed,
                this.direction.y * this.speed
            );
        }
    }
    
    /**
     * 处理击中目标
     */
    hitTarget(): void {
        this.deactivate();
    }
    
    /**
     * 停用子弹并返回到对象池
     */
    private deactivate(): void {
        if (this.lifeTimer) {
            this.lifeTimer.remove();
            this.lifeTimer = null;
        }
        
        // 重置物理状态
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.setVelocity(0, 0);
        }
        
        // 隐藏并停用对象
        this.setActive(false).setVisible(false);
        
        // 返回到对象池
        const poolManager = ObjectPoolManager.getInstance();
        poolManager.returnToPool(OptimizedBullet.POOL_KEY, this);
    }
    
    /**
     * 静态方法：从对象池获取子弹
     */
    static getFromPool(scene: Scene): OptimizedBullet {
        const poolManager = ObjectPoolManager.getInstance();
        
        return poolManager.getFromPool(OptimizedBullet.POOL_KEY, () => {
            return new OptimizedBullet(scene);
        });
    }
    
    /**
     * 静态方法：创建并发射子弹
     */
    static fire(
        scene: Scene, 
        x: number, 
        y: number, 
        direction: Phaser.Math.Vector2, 
        bulletType: string = 'bullets1'
    ): OptimizedBullet {
        const bullet = OptimizedBullet.getFromPool(scene);
        bullet.reset(x, y, direction, bulletType);
        return bullet;
    }
    
    getBulletType(): string {
        return this.bulletType;
    }
    
    static initializePool(scene: Scene, initialSize: number = 20): void {
        const poolManager = ObjectPoolManager.getInstance();
        poolManager.setMaxPoolSize(OptimizedBullet.POOL_KEY, 50);
        
        // 延迟创建子弹对象，确保所有纹理都已加载
        scene.time.delayedCall(100, () => {
            // 预创建一些子弹对象
            for (let i = 0; i < initialSize; i++) {
                const bullet = new OptimizedBullet(scene);
                bullet.setActive(false).setVisible(false);
                poolManager.returnToPool(OptimizedBullet.POOL_KEY, bullet);
            }
        });
    }
}
