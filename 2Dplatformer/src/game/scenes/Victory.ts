import { Scene } from 'phaser';
import { Game } from './Game';
import { CollectedItemData } from '../managers/CollectedItemsManager';
import { eventBus, GameEvent } from '../events/EventBus';
import { UIManager, UILayoutConfig } from '../managers/UIManager';
import { DeviceDetector } from '../utils/DeviceDetector';
import { FullscreenManager } from '../managers/FullscreenManager';

export class Victory extends Scene {
    private uiManager: UIManager;
    private totalScore: number = 0;
    private itemsByType: Map<string, CollectedItemData[]> = new Map();
    private totalItemsCollected: number = 0;
    
    constructor() {
        super('Victory');
    }
    
    init(data: { 
        totalScore?: number; 
        itemsByType?: Map<string, CollectedItemData[]>;
        totalItemsCollected?: number;
    }) {
        this.totalScore = data.totalScore || 0;
        this.itemsByType = data.itemsByType || new Map();
        this.totalItemsCollected = data.totalItemsCollected || 0;
    }

    create() {
        // Emit scene start event
        eventBus.emit(GameEvent.SCENE_START, {
            scene: 'Victory'
        });
        
        // Emit game victory event
        eventBus.emit(GameEvent.GAME_VICTORY, {
            score: this.totalScore
        });
        
        this.cameras.main.setBackgroundColor(0x4a90e2);

        const uiConfig: UILayoutConfig = {
            baseWidth: 1024,
            baseHeight: 768,
            scalingMode: 'fit',
            responsive: true,
            elements: {
                victoryTitle: {
                    type: 'text',
                    text: '🏆 VICTORY! 🏆',
                    position: { x: '50%', y: '15%' },
                    origin: { x: 0.5, y: 0.5 },
                    style: {
                        fontFamily: 'Arial Black',
                        fontSize: '72px',
                        color: '#FFD700',
                        stroke: '#000000',
                        strokeThickness: 8,
                        align: 'center',
                        shadow: {
                            offsetX: 4,
                            offsetY: 4,
                            color: '#000000',
                            blur: 8,
                            fill: true
                        }
                    },
                    depth: 10
                },
                congratsText: {
                    type: 'text',
                    text: 'Congratulations!',
                    position: { x: '50%', y: '25%' },
                    origin: { x: 0.5, y: 0.5 },
                    style: {
                        fontFamily: 'Arial',
                        fontSize: '32px',
                        color: '#ffffff',
                        stroke: '#000000',
                        strokeThickness: 4,
                        align: 'center'
                    },
                    depth: 9
                },
                scoreLabel: {
                    type: 'text',
                    text: 'Final Score',
                    position: { x: '50%', y: '35%' },
                    origin: { x: 0.5, y: 0.5 },
                    style: {
                        fontFamily: 'Arial',
                        fontSize: '24px',
                        color: '#cccccc',
                        align: 'center'
                    },
                    depth: 8
                },
                scoreValue: {
                    type: 'text',
                    text: `${this.totalScore}`,
                    position: { x: '50%', y: '42%' },
                    origin: { x: 0.5, y: 0.5 },
                    style: {
                        fontFamily: 'Arial Black',
                        fontSize: '56px',
                        color: '#FFD700',
                        stroke: '#000000',
                        strokeThickness: 6,
                        align: 'center'
                    },
                    depth: 9
                },
                itemsContainer: {
                    type: 'container',
                    position: { x: '50%', y: '55%' },
                    children: [],
                    depth: 5
                },
                playAgainButton: {
                    type: 'button',
                    text: '🎮 PLAY AGAIN',
                    position: { x: '35%', y: '75%' },
                    scale: 1,
                    textStyle: {
                        fontFamily: 'Arial Black',
                        fontSize: '28px',
                        color: '#ffffff',
                        stroke: '#000000',
                        strokeThickness: 5
                    },
                    onClick: () => this.playAgain(),
                    hoverScale: 1.1,
                    clickScale: 0.95,
                    depth: 10
                },
                menuButton: {
                    type: 'button',
                    text: '🏠 MAIN MENU',
                    position: { x: '65%', y: '75%' },
                    scale: 1,
                    textStyle: {
                        fontFamily: 'Arial Black',
                        fontSize: '28px',
                        color: '#ffffff',
                        stroke: '#000000',
                        strokeThickness: 5
                    },
                    onClick: () => this.returnToMenu(),
                    hoverScale: 1.1,
                    clickScale: 0.95,
                    depth: 10
                },
                instructions: {
                    type: 'text',
                    text: 'Press SPACE to play again • ESC for main menu',
                    position: { x: '50%', y: '88%' },
                    origin: { x: 0.5, y: 0.5 },
                    style: {
                        fontFamily: 'Arial',
                        fontSize: '18px',
                        color: '#ffffff',
                        align: 'center'
                    },
                    depth: 8
                },
                perfectText: {
                    type: 'text',
                    text: this.totalItemsCollected > 0 ? '✨ Perfect Collection! ✨' : '',
                    position: { x: '50%', y: '95%' },
                    origin: { x: 0.5, y: 0.5 },
                    style: {
                        fontFamily: 'Arial',
                        fontSize: '20px',
                        color: '#FFD700',
                        fontStyle: 'italic',
                        align: 'center'
                    },
                    depth: 8,
                    visible: this.totalItemsCollected >= 3
                }
            }
        };

        this.uiManager = new UIManager(this, uiConfig);
        this.uiManager.createUI();

        // Animate victory title
        this.uiManager.animateElement('victoryTitle', {
            scale: { from: 0, to: this.uiManager.getScale() },
            rotation: { from: -0.2, to: 0 },
            alpha: { from: 0, to: 1 },
            duration: 800,
            ease: 'Back.easeOut'
        });

        // Pulse animation for victory title
        this.time.delayedCall(800, () => {
            this.uiManager.animateElement('victoryTitle', {
                scale: this.uiManager.getScale() * 1.05,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // Animate congratulations text
        this.uiManager.animateElement('congratsText', {
            y: { from: '20%', to: '25%' },
            alpha: { from: 0, to: 1 },
            duration: 600,
            delay: 200,
            ease: 'Power2.easeOut'
        });

        // Animate score display with counting effect
        this.uiManager.animateElement('scoreLabel', {
            alpha: { from: 0, to: 1 },
            duration: 500,
            delay: 400
        });

        const scoreElement = this.uiManager.getElement('scoreValue') as Phaser.GameObjects.Text;
        if (scoreElement) {
            scoreElement.setAlpha(0);
            this.time.delayedCall(600, () => {
                scoreElement.setAlpha(1);
                // Score counting animation
                let currentScore = 0;
                const scoreIncrement = Math.ceil(this.totalScore / 30);
                const scoreTimer = this.time.addEvent({
                    delay: 30,
                    repeat: -1,
                    callback: () => {
                        currentScore = Math.min(currentScore + scoreIncrement, this.totalScore);
                        scoreElement.setText(`${currentScore}`);
                        if (currentScore >= this.totalScore) {
                            scoreTimer.remove();
                            // Flash effect when score completes
                            this.tweens.add({
                                targets: scoreElement,
                                scale: this.uiManager.getScale() * 1.3,
                                duration: 200,
                                yoyo: true,
                                ease: 'Power2'
                            });
                        }
                    }
                });
            });
        }

        // Display collected items
        this.displayCollectedItems();

        // Animate buttons fade in (no sliding)
        this.uiManager.animateElement('playAgainButton', {
            scale: { from: 0, to: this.uiManager.getScale() },
            alpha: { from: 0, to: 1 },
            duration: 400,
            delay: 1000,
            ease: 'Back.easeOut'
        });

        this.uiManager.animateElement('menuButton', {
            scale: { from: 0, to: this.uiManager.getScale() },
            alpha: { from: 0, to: 1 },
            duration: 400,
            delay: 1100,
            ease: 'Back.easeOut'
        });

        // Fade in instructions
        this.uiManager.animateElement('instructions', {
            alpha: { from: 0, to: 1 },
            duration: 800,
            delay: 1300
        });

        // Animate perfect collection text if applicable
        if (this.totalItemsCollected >= 3) {
            this.uiManager.animateElement('perfectText', {
                alpha: { from: 0, to: 1 },
                scale: { from: 0.5, to: this.uiManager.getScale() },
                duration: 800,
                delay: 1500,
                ease: 'Elastic.easeOut'
            });
        }

        // Create star particle effect
        this.createStarParticles();
        
        // Create confetti effect
        this.createConfetti();

        // Setup keyboard shortcuts
        const spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        spaceKey?.once('down', () => this.playAgain());
        
        const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        escKey?.once('down', () => this.returnToMenu());
        
        // Add fullscreen button for mobile devices
        if (DeviceDetector.isMobile() && DeviceDetector.isFullscreenSupported()) {
            FullscreenManager.getInstance().createFullscreenButton(this);
        }
    }
    
    private displayCollectedItems(): void {
        const container = this.uiManager.getElement('itemsContainer') as Phaser.GameObjects.Container;
        if (!container) return;

        let itemIndex = 0;
        const totalItems = Array.from(this.itemsByType.values()).flat().length;
        const itemSpacing = 100;
        
        this.itemsByType.forEach((items) => {
            items.forEach((item) => {
                if (item.count > 0) {
                    const offsetX = (itemIndex - (totalItems - 1) / 2) * itemSpacing;
                    
                    // Item image
                    const itemImage = this.add.image(offsetX, 0, item.name);
                    itemImage.setScale(0);
                    itemImage.setDepth(10);
                    container.add(itemImage);
                    
                    // Count badge
                    const countBg = this.add.circle(offsetX + 25, -25, 16, 0x000000, 0.9);
                    const countText = this.add.text(offsetX + 25, -25, `${item.count}`, {
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
                    container.add(countBg);
                    container.add(countText);
                    
                    // Animate item appearance
                    this.time.delayedCall(800 + itemIndex * 150, () => {
                        this.tweens.add({
                            targets: itemImage,
                            scale: 1.2 * this.uiManager.getScale(),
                            duration: 400,
                            ease: 'Back.easeOut'
                        });
                        
                        this.tweens.add({
                            targets: [countBg, countText],
                            alpha: 1,
                            scale: { from: 0.5, to: 1 },
                            duration: 300,
                            delay: 100,
                            ease: 'Back.easeOut'
                        });
                        
                        // Floating animation
                        this.tweens.add({
                            targets: [itemImage, countBg, countText],
                            y: '-=10',
                            duration: 2000,
                            yoyo: true,
                            repeat: -1,
                            ease: 'Sine.easeInOut',
                            delay: itemIndex * 100
                        });
                    });
                    
                    itemIndex++;
                }
            });
        });
        
        // If no items collected, show a message
        if (itemIndex === 0) {
            const noItemsText = this.add.text(0, 0, 'No items collected', {
                fontSize: '24px',
                color: '#aaaaaa',
                fontFamily: 'Arial'
            });
            noItemsText.setOrigin(0.5);
            noItemsText.setAlpha(0);
            container.add(noItemsText);
            
            this.time.delayedCall(800, () => {
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
                star.setDepth(0);
                
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
    
    private createConfetti(): void {
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
        
        for (let i = 0; i < 30; i++) {
            this.time.delayedCall(i * 50, () => {
                const x = Phaser.Math.Between(0, this.cameras.main.width);
                const confetti = this.add.rectangle(x, -20, 10, 20, Phaser.Utils.Array.GetRandom(colors));
                confetti.setDepth(15);
                
                this.tweens.add({
                    targets: confetti,
                    y: this.cameras.main.height + 20,
                    x: x + Phaser.Math.Between(-100, 100),
                    rotation: Math.PI * 4,
                    duration: Phaser.Math.Between(2000, 3000),
                    ease: 'Sine.easeIn',
                    onComplete: () => {
                        confetti.destroy();
                    }
                });
            });
        }
    }
    
    private playAgain(): void {
        // Emit scene change event
        eventBus.emit(GameEvent.SCENE_CHANGE, {
            from: 'Victory',
            to: 'Game'
        });
        
        // Re-add and start a fresh Game scene
        this.scene.add('Game', Game, false);
        this.scene.start('Game');
        this.scene.stop('Victory');
        
        // Clean up UI
        this.uiManager.destroy();
    }
    
    private returnToMenu(): void {
        // Emit scene change event
        eventBus.emit(GameEvent.SCENE_CHANGE, {
            from: 'Victory',
            to: 'MainMenu'
        });
        
        this.scene.start('MainMenu');
        this.scene.stop('Victory');
        
        // Clean up UI
        this.uiManager.destroy();
    }
}