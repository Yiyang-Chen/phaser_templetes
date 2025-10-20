import Phaser from 'phaser';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
    private velocity: number;
    private lifetime: number = 3000;
    private createdTime: number;
    private direction: Phaser.Math.Vector2;
    private useGravity: boolean;
    private needsImmediateCheck: boolean = false;
    private owner: Phaser.Physics.Arcade.Sprite;
    
    // 穿透系统
    private pierceCount: number = 0;        // 已穿透敌人数
    private maxPierceCount: number = 1;     // 最大穿透（1=不穿透，击中1个就销毁）
    
    // 反弹系统
    private bounceCount: number = 0;        // 已反弹次数
    private maxBounceCount: number = 0;     // 最大反弹（0=不反弹，撞墙销毁）
    private lastBlocked = { left: false, right: false, up: false, down: false };  // 防止重复触发
    
    // 伤害系统
    private baseDamage: number = 1;
    private damageDecayPerPierce: number = 0.2;  // 每次穿透减少20%伤害
    
    constructor(
        scene: Phaser.Scene, 
        x: number, 
        y: number, 
        direction: { x: number, y: number }, 
        velocity: number, 
        useGravity: boolean, 
        owner: Phaser.Physics.Arcade.Sprite, 
        ownerVelocity?: { x: number, y: number },
        config?: {
            maxPierceCount?: number;   // 最大穿透数（默认1）
            maxBounceCount?: number;   // 最大反弹数（默认0）
            damage?: number;           // 基础伤害（默认1）
            damageDecay?: number;      // 穿透伤害衰减（默认0.2）
        }
    ) {
        super(scene, x, y, 'bullet');

        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Normalize direction vector
        this.direction = new Phaser.Math.Vector2(direction.x, direction.y).normalize();
        this.velocity = velocity;
        this.useGravity = useGravity;
        this.owner = owner;
        
        // 应用配置
        if (config) {
            this.maxPierceCount = config.maxPierceCount ?? 1;
            this.maxBounceCount = config.maxBounceCount ?? 0;
            this.baseDamage = config.damage ?? 1;
            this.damageDecayPerPierce = config.damageDecay ?? 0.2;
        }
        
        this.setCircle(8);
        this.setScale(1.5);
        
        this.setBounce(0);
        
        // TopDown game doesn't use gravity, but keep the parameter for API consistency
        // In case world gravity is not 0, cancel it
        if (!this.useGravity && scene.physics.world.gravity.y !== 0) {
            this.setGravityY(-scene.physics.world.gravity.y);
        }
        
        // Set velocity based on direction vector and speed
        const ownerVx = ownerVelocity?.x || 0;
        const ownerVy = ownerVelocity?.y || 0;
        const bulletVx = this.velocity * this.direction.x + ownerVx * 0.5;
        const bulletVy = this.velocity * this.direction.y + ownerVy * 0.3;
        
        this.setVelocity(bulletVx, bulletVy);
        this.setDepth(1000); // Render above most objects
        
        this.createdTime = scene.time.now;
        
        console.log(`[Bullet] Constructor complete - pos: (${this.x}, ${this.y}), vel: (${bulletVx}, ${bulletVy}), active: ${this.active}, body exists: ${!!this.body}`);
        
        // Create bullet texture if it doesn't exist
        if (!scene.textures.exists('bullet')) {
            const graphics = scene.add.graphics();
            graphics.fillStyle(0xffff00, 1);
            graphics.fillCircle(0, 0, 8);
            graphics.generateTexture('bullet', 16, 16);
            graphics.destroy();
        }
        this.setTexture('bullet');
        
        this.setTint(0xffff00);
        
        this.scene.tweens.add({
            targets: this,
            scale: { from: 0.8, to: 1.5 },
            duration: 100,
            ease: 'Back.easeOut'
        });
        
        this.createTrailEffect();
    }
    
    private createTrailEffect(): void {
        const trailInterval = this.scene.time.addEvent({
            delay: 30,
            callback: () => {
                if (!this.active) {
                    trailInterval.destroy();
                    return;
                }
                
                const trail = this.scene.add.circle(
                    this.x,
                    this.y,
                    5,
                    0xffff00,
                    0.6
                );
                
                this.scene.tweens.add({
                    targets: trail,
                    scale: { from: 1, to: 0 },
                    alpha: { from: 0.6, to: 0 },
                    duration: 300,
                    onComplete: () => {
                        trail.destroy();
                    }
                });
            },
            loop: true
        });
    }
    
    update(): void {
        if (!this.active) {
            console.log('[Bullet] update() called but not active');
            return;
        }
        
        const timeSinceCreation = this.scene.time.now - this.createdTime;
        
        // Debug: 前100ms每次都打印
        if (timeSinceCreation < 100) {
            console.log(`[Bullet] update() - time: ${timeSinceCreation.toFixed(0)}ms, pos: (${this.x.toFixed(0)}, ${this.y.toFixed(0)}), vel: (${this.body?.velocity.x.toFixed(0)}, ${this.body?.velocity.y.toFixed(0)}), blocked: L=${this.body?.blocked.left} R=${this.body?.blocked.right} U=${this.body?.blocked.up} D=${this.body?.blocked.down}`);
        }
        
        // 超时销毁
        if (timeSinceCreation > this.lifetime) {
            this.destroyBullet();
            return;
        }
        
        // Debug: 每秒打印一次状态
        if (Math.floor(timeSinceCreation / 1000) !== Math.floor((timeSinceCreation - 16) / 1000)) {
            console.log(`[Bullet] Alive ${(timeSinceCreation/1000).toFixed(1)}s, pos: (${this.x.toFixed(0)}, ${this.y.toFixed(0)}), vel: (${this.body?.velocity.x.toFixed(0)}, ${this.body?.velocity.y.toFixed(0)}), blocked: L=${this.body?.blocked.left} R=${this.body?.blocked.right} U=${this.body?.blocked.up} D=${this.body?.blocked.down}`);
        }
        
        // 处理墙壁碰撞（反弹系统）
        this.handleWallCollision();
        
        // 旋转朝向速度方向
        const velocity = this.body?.velocity;
        if (velocity) {
            const angle = Math.atan2(velocity.y, velocity.x);
            this.setRotation(angle);
        }
    }
    
    /**
     * 处理墙壁碰撞（反弹系统）
     */
    private handleWallCollision(): void {
        if (!this.body) return;
        
        const blocked = this.body.blocked;
        
        // 检测新的碰撞（避免重复触发）
        const hasNewCollision = 
            (blocked.left && !this.lastBlocked.left) ||
            (blocked.right && !this.lastBlocked.right) ||
            (blocked.up && !this.lastBlocked.up) ||
            (blocked.down && !this.lastBlocked.down);
        
        if (hasNewCollision) {
            console.log(`[Bullet] Wall collision detected! Blocked: L=${blocked.left} R=${blocked.right} U=${blocked.up} D=${blocked.down}, bounceCount=${this.bounceCount}/${this.maxBounceCount}`);
            
            // 检查是否还能反弹
            if (this.bounceCount >= this.maxBounceCount) {
                // 反弹次数用尽 → 销毁
                console.log(`[Bullet] Bounce limit reached, destroying`);
                this.destroyBullet();
                return;
            }
            
            // 可以反弹 → 改变方向
            this.bounceCount++;
            
            const currentVel = this.body.velocity;
            
            // 左右墙壁：反转X方向
            if (blocked.left || blocked.right) {
                this.setVelocityX(-currentVel.x);
                this.direction.x = -this.direction.x;
            }
            
            // 上下墙壁：反转Y方向
            if (blocked.up || blocked.down) {
                this.setVelocityY(-currentVel.y);
                this.direction.y = -this.direction.y;
            }
            
            // 创建反弹特效
            this.createBounceEffect();
        }
        
        // 记录当前blocked状态
        this.lastBlocked = {
            left: blocked.left,
            right: blocked.right,
            up: blocked.up,
            down: blocked.down
        };
    }
    
    destroyBullet(): void {
        console.log(`[Bullet] destroyBullet() called at (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
        
        for (let i = 0; i < 8; i++) {
            const particle = this.scene.add.circle(
                this.x + Phaser.Math.Between(-5, 5),
                this.y + Phaser.Math.Between(-5, 5),
                Phaser.Math.Between(1, 3),
                0xffff00,
                1
            );
            
            this.scene.physics.add.existing(particle);
            const body = particle.body as Phaser.Physics.Arcade.Body;
            body.setVelocity(
                Phaser.Math.Between(-100, 100),
                Phaser.Math.Between(-100, 100)
            );
            
            this.scene.tweens.add({
                targets: particle,
                scale: { from: 1, to: 0 },
                alpha: { from: 1, to: 0 },
                duration: 400,
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
        
        const flash = this.scene.add.circle(this.x, this.y, 8, 0xffffff, 0.8);
        this.scene.tweens.add({
            targets: flash,
            scale: { from: 1, to: 2 },
            alpha: { from: 0.8, to: 0 },
            duration: 200,
            onComplete: () => {
                flash.destroy();
            }
        });
        
        this.destroy();
        
        // 从Game的bullets数组中移除
        // (这会在下一次update时自动清理，因为我们检查active状态)
    }
    
    /**
     * 击中敌人（穿透系统）
     * @returns 当前伤害值
     */
    hitEnemy(): number {
        this.pierceCount++;
        
        // 计算当前伤害（每次穿透递减）
        const currentDamage = this.baseDamage * Math.pow(1 - this.damageDecayPerPierce, this.pierceCount - 1);
        
        // 创建击中特效
        this.createHitEffect();
        
        // 检查是否用尽穿透次数
        if (this.pierceCount >= this.maxPierceCount) {
            // 穿透次数用尽 → 延迟销毁（确保伤害生效）
            this.scene.time.delayedCall(1, () => {
                this.destroyBullet();
            });
        } else {
            // 还能继续穿透 → 显示穿透效果
            this.createPierceEffect();
        }
        
        return currentDamage;
    }
    
    /**
     * 反弹特效（白色冲击波）
     */
    private createBounceEffect(): void {
        // 白色冲击波
        const wave = this.scene.add.circle(this.x, this.y, 8, 0xffffff, 0);
        wave.setStrokeStyle(3, 0xffffff, 1);
        
        this.scene.tweens.add({
            targets: wave,
            scale: { from: 1, to: 3 },
            alpha: { from: 1, to: 0 },
            duration: 200,
            ease: 'Power2',
            onComplete: () => wave.destroy()
        });
        
        // 火花粒子
        for (let i = 0; i < 5; i++) {
            const spark = this.scene.add.circle(
                this.x + Phaser.Math.Between(-5, 5),
                this.y + Phaser.Math.Between(-5, 5),
                2,
                0xffffff,
                1
            );
            
            this.scene.physics.add.existing(spark);
            const body = spark.body as Phaser.Physics.Arcade.Body;
            body.setVelocity(
                Phaser.Math.Between(-100, 100),
                Phaser.Math.Between(-100, 100)
            );
            
            this.scene.tweens.add({
                targets: spark,
                scale: { from: 1, to: 0 },
                alpha: { from: 1, to: 0 },
                duration: 300,
                onComplete: () => spark.destroy()
            });
        }
    }
    
    /**
     * 穿透特效（青色环）
     */
    private createPierceEffect(): void {
        // 闪光效果
        const originalTint = this.tintTopLeft;
        this.setTint(0xffffff);
        this.scene.time.delayedCall(50, () => {
            this.setTint(originalTint);
        });
        
        // 青色穿透环
        const ring = this.scene.add.circle(this.x, this.y, 10, 0x00ffff, 0);
        ring.setStrokeStyle(2, 0x00ffff, 1);
        
        this.scene.tweens.add({
            targets: ring,
            scale: { from: 1, to: 2.5 },
            alpha: { from: 1, to: 0 },
            duration: 250,
            ease: 'Power2',
            onComplete: () => ring.destroy()
        });
    }
    
    /**
     * 击中特效（黄色星星）
     */
    private createHitEffect(): void {
        for (let i = 0; i < 12; i++) {
            const star = this.scene.add.star(
                this.x + Phaser.Math.Between(-10, 10),
                this.y + Phaser.Math.Between(-10, 10),
                5,
                2,
                4,
                0xffff00
            );
            star.setScale(Phaser.Math.FloatBetween(0.3, 0.8));
            
            this.scene.physics.add.existing(star);
            const body = star.body as Phaser.Physics.Arcade.Body;
            body.setVelocity(
                Phaser.Math.Between(-200, 200),
                Phaser.Math.Between(-200, 200)
            );
            
            this.scene.tweens.add({
                targets: star,
                scale: { from: star.scale, to: 0 },
                alpha: { from: 1, to: 0 },
                rotation: Math.PI * 2,
                duration: 600,
                onComplete: () => {
                    star.destroy();
                }
            });
        }
    }
    
    setImmediateCollisionCheck(value: boolean): void {
        this.needsImmediateCheck = value;
    }
    
    getNeedsImmediateCheck(): boolean {
        return this.needsImmediateCheck;
    }
    
    getOwner(): Phaser.Physics.Arcade.Sprite {
        return this.owner;
    }
}