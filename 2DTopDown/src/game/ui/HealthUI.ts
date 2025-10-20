import { Scene } from 'phaser';

export class HealthUI {
    private scene: Scene;
    private hearts: Phaser.GameObjects.Graphics[] = [];
    private maxHealth: number;
    private currentHealth: number;
    private heartSize: number = 30;
    private heartSpacing: number = 40;
    private x: number;
    private y: number;

    constructor(scene: Scene, x: number = 50, y: number = 50, maxHealth: number = 3) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
        
        this.createHearts();
    }

    private createHearts(): void {
        for (let i = 0; i < this.maxHealth; i++) {
            const heart = this.scene.add.graphics();
            const heartX = this.x + (i * this.heartSpacing);
            const heartY = this.y;
            
            this.drawHeart(heart, heartX, heartY, true);
            heart.setScrollFactor(0);
            heart.setDepth(1000);
            
            this.hearts.push(heart);
        }
    }

    private drawHeart(graphics: Phaser.GameObjects.Graphics, x: number, y: number, filled: boolean): void {
        graphics.clear();
        
        if (filled) {
            graphics.fillStyle(0xff0000, 1);
            graphics.lineStyle(2, 0xffffff, 1);
        } else {
            graphics.fillStyle(0x333333, 0.5);
            graphics.lineStyle(2, 0x666666, 1);
        }
        
        // Draw heart shape
        const size = this.heartSize;
        const halfSize = size / 2;
        const quarterSize = size / 4;
        
        graphics.beginPath();
        graphics.moveTo(x, y + quarterSize);
        
        // Upper left semicircle
        graphics.arc(x - quarterSize, y - quarterSize, quarterSize, Math.PI, 0, false);
        
        // Upper right semicircle
        graphics.arc(x + quarterSize, y - quarterSize, quarterSize, Math.PI, 0, false);
        
        // Right side curve to bottom
        graphics.lineTo(x + halfSize, y);
        graphics.lineTo(x, y + halfSize);
        
        // Left side curve to bottom
        graphics.lineTo(x - halfSize, y);
        
        graphics.closePath();
        graphics.fillPath();
        graphics.strokePath();
    }

    updateHealth(health: number): void {
        if (health < 0) health = 0;
        if (health > this.maxHealth) health = this.maxHealth;
        
        const oldHealth = this.currentHealth;
        this.currentHealth = health;
        
        // Update heart display
        for (let i = 0; i < this.maxHealth; i++) {
            const heart = this.hearts[i];
            const heartX = this.x + (i * this.heartSpacing);
            const heartY = this.y;
            
            if (i < health) {
                // Full health heart
                this.drawHeart(heart, heartX, heartY, true);
                
                // If this is newly recovered health, add animation
                if (oldHealth < health && i === health - 1) {
                    this.scene.tweens.add({
                        targets: heart,
                        scaleX: 1.3,
                        scaleY: 1.3,
                        duration: 200,
                        yoyo: true,
                        ease: 'Back.easeOut'
                    });
                }
            } else {
                // Empty health heart
                this.drawHeart(heart, heartX, heartY, false);
                
                // If this is newly lost health, add break animation
                if (oldHealth > health && i === health) {
                    this.createHeartBreakEffect(heartX, heartY);
                    
                    this.scene.tweens.add({
                        targets: heart,
                        scaleX: 0.8,
                        scaleY: 0.8,
                        alpha: 0.5,
                        duration: 300,
                        ease: 'Power2',
                        onComplete: () => {
                            heart.scaleX = 1;
                            heart.scaleY = 1;
                            heart.alpha = 1;
                        }
                    });
                }
            }
        }
    }

    private createHeartBreakEffect(x: number, y: number): void {
        // Create fragment effect
        for (let i = 0; i < 6; i++) {
            const particle = this.scene.add.graphics();
            particle.fillStyle(0xff0000, 1);
            particle.fillCircle(0, 0, 3);
            particle.x = x;
            particle.y = y;
            particle.setScrollFactor(0);
            particle.setDepth(999);
            
            const angle = (Math.PI * 2 / 6) * i;
            const distance = 30;
            
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }

    setMaxHealth(maxHealth: number): void {
        // Clear old hearts
        this.hearts.forEach(heart => heart.destroy());
        this.hearts = [];
        
        // Set new maximum health
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
        
        // Recreate hearts
        this.createHearts();
    }

    destroy(): void {
        this.hearts.forEach(heart => heart.destroy());
        this.hearts = [];
    }
}