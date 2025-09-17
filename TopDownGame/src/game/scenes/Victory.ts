import { Scene } from 'phaser';
import { Game } from './Game';
import { CollectedItemData } from '../managers/CollectedItemsManager';

export class Victory extends Scene {
    private totalScore: number = 0;
    private itemsByType: Map<string, CollectedItemData[]> = new Map();
    private totalItemsCollected: number = 0;
    private gameTime: number = 0;
    private timeScore: number = 0;
    private killScore: number = 0;
    private killCount: number = 0;
    // private uniqueItemsCollected: number = 0;
    
    constructor() {
        super('Victory');
    }
    
    init(data: { 
        totalScore?: number; 
        itemsByType?: Map<string, CollectedItemData[]>;
        totalItemsCollected?: number;
        gameTime?: number;
        timeScore?: number;
        killScore?: number;
        killCount?: number;
        // uniqueItemsCollected?: number;
    }) {
        this.totalScore = data.totalScore || 0;
        this.itemsByType = data.itemsByType || new Map();
        this.totalItemsCollected = data.totalItemsCollected || 0;
        this.gameTime = data.gameTime || 0;
        this.timeScore = data.timeScore || 0;
        this.killScore = data.killScore || 0;
        this.killCount = data.killCount || 0;
        // this.uniqueItemsCollected = data.uniqueItemsCollected || 0;
    }

    create() {
        this.cameras.main.setBackgroundColor(0x4a90e2);
        
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        // Victory title
        const victoryText = this.add.text(centerX, 80, 'You Win!', {
            fontFamily: 'Arial Black',
            fontSize: 64,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8
        });
        victoryText.setOrigin(0.5);
        
        // Animation effect
        this.tweens.add({
            targets: victoryText,
            scale: { from: 0, to: 1 },
            duration: 500,
            ease: 'Back.easeOut'
        });
        
        // Display total score
        const scoreText = this.add.text(centerX, 160, `Total Score: ${this.totalScore}`, {
            fontFamily: 'Arial Black',
            fontSize: 42,
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 6
        });
        scoreText.setOrigin(0.5);
        scoreText.setAlpha(0);
        
        // Display time information
        const minutes = Math.floor(this.gameTime / 60000);
        const seconds = Math.floor((this.gameTime % 60000) / 1000);
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const timeText = this.add.text(centerX, 210, `Game Time: ${timeString}`, {
            fontFamily: 'Arial Black',
            fontSize: 32,
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 4
        });
        timeText.setOrigin(0.5);
        timeText.setAlpha(0);
        
        const timeScoreText = this.add.text(centerX, 250, `Time Bonus: ${this.timeScore}`, {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#90EE90',
            stroke: '#000000',
            strokeThickness: 4
        });
        timeScoreText.setOrigin(0.5);
        timeScoreText.setAlpha(0);
        
        // Display kill information
        const killText = this.add.text(centerX, 290, `Enemies Killed: ${this.killCount}`, {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 4
        });
        killText.setOrigin(0.5);
        killText.setAlpha(0);
        
        const killScoreText = this.add.text(centerX, 330, `Kill Bonus: ${this.killScore}`, {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#FFB347',
            stroke: '#000000',
            strokeThickness: 4
        });
        killScoreText.setOrigin(0.5);
        killScoreText.setAlpha(0);
        
        this.time.delayedCall(300, () => {
            this.tweens.add({
                targets: scoreText,
                alpha: 1,
                scale: { from: 0.5, to: 1 },
                duration: 500,
                ease: 'Back.easeOut'
            });
        });
        
        this.time.delayedCall(500, () => {
            this.tweens.add({
                targets: timeText,
                alpha: 1,
                scale: { from: 0.5, to: 1 },
                duration: 500,
                ease: 'Back.easeOut'
            });
        });
        
        this.time.delayedCall(700, () => {
            this.tweens.add({
                targets: timeScoreText,
                alpha: 1,
                scale: { from: 0.5, to: 1 },
                duration: 500,
                ease: 'Back.easeOut'
            });
        });
        
        this.time.delayedCall(900, () => {
            this.tweens.add({
                targets: killText,
                alpha: 1,
                scale: { from: 0.5, to: 1 },
                duration: 500,
                ease: 'Back.easeOut'
            });
        });
        
        this.time.delayedCall(1100, () => {
            this.tweens.add({
                targets: killScoreText,
                alpha: 1,
                scale: { from: 0.5, to: 1 },
                duration: 500,
                ease: 'Back.easeOut'
            });
        });
        

        // Note: Removed item collection display for survival mode
        
        // Continue game prompt
        const continueText = this.add.text(centerX, centerY + 300, 'Click to Continue', {
            fontFamily: 'Arial',
            fontSize: 28,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        continueText.setOrigin(0.5);
        continueText.setAlpha(0);
        
        this.time.delayedCall(1500, () => {
            this.tweens.add({
                targets: continueText,
                alpha: 1,
                duration: 500
            });
            
            // Blinking effect
            this.tweens.add({
                targets: continueText,
                alpha: { from: 1, to: 0.5 },
                duration: 800,
                yoyo: true,
                repeat: -1
            });
        });
        
        // Return to main menu prompt
        const menuText = this.add.text(centerX, centerY + 250, 'Press ESC to Return to Main Menu', {
            fontFamily: 'Arial',
            fontSize: 18,
            color: '#aaaaaa',
            stroke: '#000000',
            strokeThickness: 3
        });
        menuText.setOrigin(0.5);
        
        // Create star particle effect
        this.createStarParticles();
        
        // Click to continue game
        this.input.once('pointerdown', () => {
            // Re-add and start a fresh Game scene
            this.scene.add('Game', Game, false);
            this.scene.start('Game');
            this.scene.stop('Victory');
        });
        
        // ESC key to return to main menu
        const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        escKey?.once('down', () => {
            this.scene.start('MainMenu');
            this.scene.stop('Victory');
        });
    }
    
    private displayCollectedItems(): void {
        const startY = 240;
        const itemSpacing = 90;
        // let currentY = startY;
        let animationDelay = 500;
        
        // Display items grouped by type
        let rowIndex = 0;
        this.itemsByType.forEach((items, _type) => {
            // Calculate total items of this type
            let totalCount = 0;
            for (const item of items) {
                totalCount += item.count;
            }
            
            // Skip if no items collected
            if (totalCount === 0) return;
            
            const actualY = startY + (rowIndex * itemSpacing);
            
            // Display items for this type
            this.time.delayedCall(animationDelay + rowIndex * 200, () => {
                const centerX = this.cameras.main.width / 2;
                
                // Display each unique item in this type
                const itemWidth = 90;
                const startX = centerX - ((items.length - 1) * itemWidth) / 2;
                
                items.forEach((item, index) => {
                    const itemX = startX + index * itemWidth;
                    
                    // Item image
                    const itemImage = this.add.image(itemX, actualY, item.name);
                    itemImage.setScale(0);
                    itemImage.setDepth(10);
                    
                    // Count badge positioned relative to the image
                    const countBg = this.add.circle(itemX + 25, actualY - 25, 16, 0x000000, 0.9);
                    const countText = this.add.text(itemX + 25, actualY - 25, `${item.count}`, {
                        fontSize: '20px',
                        color: '#ffffff',
                        fontFamily: 'Arial Black',
                        stroke: '#000000',
                        strokeThickness: 2
                    });
                    countText.setOrigin(0.5);
                    countBg.setAlpha(0);
                    countText.setAlpha(0);
                    countBg.setDepth(11);
                    countText.setDepth(12);
                    
                    // Animate item appearance
                    this.tweens.add({
                        targets: itemImage,
                        scale: 1.3,
                        duration: 400,
                        ease: 'Back.easeOut',
                        delay: index * 100
                    });
                    
                    // Animate count badge
                    this.time.delayedCall(100 + index * 100, () => {
                        this.tweens.add({
                            targets: [countBg, countText],
                            alpha: 1,
                            scale: { from: 0.5, to: 1 },
                            duration: 300,
                            ease: 'Back.easeOut'
                        });
                    });
                    
                    // Add floating animation with offset to prevent sync
                    this.tweens.add({
                        targets: itemImage,
                        y: actualY - 8,
                        duration: 1500 + index * 100,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut',
                        delay: 500 + index * 50
                    });
                    
                    // Also animate the count badge with the item
                    this.tweens.add({
                        targets: [countBg, countText],
                        y: [actualY - 25, actualY - 33],
                        duration: 1500 + index * 100,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut',
                        delay: 600 + index * 50
                    });
                });
            });
            
            rowIndex++;
        });
        
        // If no items collected, show a message
        if (this.itemsByType.size === 0 || this.totalItemsCollected === 0) {
            const noItemsText = this.add.text(
                this.cameras.main.width / 2, 
                startY,
                'No items collected',
                {
                    fontSize: '24px',
                    color: '#aaaaaa',
                    fontFamily: 'Arial'
                }
            );
            noItemsText.setOrigin(0.5);
            noItemsText.setAlpha(0);
            
            this.time.delayedCall(500, () => {
                this.tweens.add({
                    targets: noItemsText,
                    alpha: 1,
                    duration: 500
                });
            });
        }
    }
    
    private createStarParticles(): void {
        const colors = [0xffff00, 0xffffff, 0xffcc00];
        
        for (let i = 0; i < 15; i++) {
            this.time.delayedCall(i * 150, () => {
                const x = Phaser.Math.Between(100, this.cameras.main.width - 100);
                const y = Phaser.Math.Between(50, this.cameras.main.height - 50);
                const color = Phaser.Utils.Array.GetRandom(colors);
                
                const star = this.add.star(x, y, 5, 3, 6, color);
                star.setScale(0);
                star.setDepth(-1);
                
                this.tweens.add({
                    targets: star,
                    scale: { from: 0, to: 0.8 },
                    rotation: { from: 0, to: Math.PI * 2 },
                    duration: 1000,
                    ease: 'Power2'
                });
                
                this.tweens.add({
                    targets: star,
                    alpha: { from: 1, to: 0 },
                    delay: 1000,
                    duration: 500,
                    onComplete: () => {
                        star.destroy();
                    }
                });
            });
        }
    }
}