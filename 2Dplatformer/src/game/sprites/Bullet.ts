import Phaser from 'phaser';
import { eventBus, GameEvent } from '../events/EventBus';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
    private velocity: number;
    private bounceCount: number = 0;
    private lifetime: number = 5000;
    private createdTime: number;
    private direction: Phaser.Math.Vector2;
    private useGravity: boolean;
    private minBounceVelocity: number = 250;
    private maxBounceVelocity: number = 350;
    private needsImmediateCheck: boolean = false;
    private owner: Phaser.Physics.Arcade.Sprite;
    
    constructor(
        scene: Phaser.Scene, 
        x: number, 
        y: number, 
        direction: { x: number, y: number }, 
        velocity: number, 
        useGravity: boolean, 
        owner: Phaser.Physics.Arcade.Sprite, 
        ownerVelocity?: { x: number, y: number }
    ) {
        super(scene, x, y, 'bullet');

        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Normalize direction vector
        this.direction = new Phaser.Math.Vector2(direction.x, direction.y).normalize();
        this.velocity = velocity;
        this.useGravity = useGravity;
        this.owner = owner;
        
        this.setCircle(8);
        this.setScale(1.5);
        
        this.setBounce(0, 0.6);
        
        // Apply gravity only if useGravity is true
        if (!this.useGravity) {
            this.setGravityY(-1400);  // Cancel world gravity for non-gravity bullets
        }
        
        // Set velocity based on direction vector and speed
        const ownerVx = ownerVelocity?.x || 0;
        const ownerVy = ownerVelocity?.y || 0;
        this.setVelocityX(this.velocity * this.direction.x + ownerVx * 0.5);
        this.setVelocityY(this.velocity * this.direction.y + ownerVy * 0.3);
        
        this.createdTime = scene.time.now;
        
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
        if (this.scene.time.now - this.createdTime > this.lifetime) {
            this.destroyBullet();
            return;
        }
        
        // Maintain velocity in the direction vector (only if using gravity, otherwise let it fly straight)
        if (this.useGravity) {
            const currentVx = this.body?.velocity.x || 0;
            const targetVx = this.velocity * this.direction.x;
            if (Math.abs(currentVx) < Math.abs(targetVx) * 0.9) {
                this.setVelocityX(targetVx);
            }
        }
        
        if (this.body?.blocked.down || this.body?.blocked.up) {
            this.bounceCount++;
            
            if (this.body.blocked.down && this.useGravity) {
                // Calculate bounce velocity based on current falling speed
                // but clamp it to maintain consistent bounce height
                const currentVy = Math.abs(this.body?.velocity.y || 0);
                let bounceVy = Math.min(currentVy * 0.8, this.maxBounceVelocity);
                bounceVy = Math.max(bounceVy, this.minBounceVelocity);
                
                this.setVelocityY(-bounceVy);
                // Ensure velocity is maintained after bounce
                this.setVelocityX(this.velocity * this.direction.x);
                
                const bounceSpark = this.scene.add.circle(
                    this.x,
                    this.y + 8,
                    2,
                    0xffffff,
                    1
                );
                
                this.scene.tweens.add({
                    targets: bounceSpark,
                    scale: { from: 1, to: 2 },
                    alpha: { from: 1, to: 0 },
                    duration: 200,
                    onComplete: () => {
                        bounceSpark.destroy();
                    }
                });
            }
        }
        
        if (this.body?.blocked.left || this.body?.blocked.right) {
            this.destroyBullet();
        }
        
        const velocity = this.body?.velocity;
        if (velocity) {
            const angle = Math.atan2(velocity.y, velocity.x);
            this.setRotation(angle);
        }
    }
    
    destroyBullet(): void {
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
    }
    
    hitEnemy(): void {     
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
        
        this.destroy();
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