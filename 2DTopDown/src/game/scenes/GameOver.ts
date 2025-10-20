import { Scene } from 'phaser';
import { Game } from './Game';
import { eventBus, GameEvent } from '../events/EventBus';
import { UIManager, UILayoutConfig } from '../managers/UIManager';
import { DeviceDetector } from '../utils/DeviceDetector';
import { FullscreenManager } from '../managers/FullscreenManager';

export class GameOver extends Scene
{
    private uiManager: UIManager;

    constructor ()
    {
        super('GameOver');
    }

    create ()
    {
        // Emit scene start event
        eventBus.emit(GameEvent.SCENE_START, {
            scene: 'GameOver'
        });
        
        this.cameras.main.setBackgroundColor(0x2c2c2c);

        const uiConfig: UILayoutConfig = {
            baseWidth: 1024,
            baseHeight: 768,
            scalingMode: 'fit',
            responsive: true,
            elements: {
                background: {
                    type: 'image',
                    texture: 'background',
                    position: { x: '50%', y: '50%' },
                    origin: { x: 0.5, y: 0.5 },
                    alpha: 0.3,
                    depth: 0
                },
                gameOverText: {
                    type: 'text',
                    text: 'GAME OVER',
                    position: { x: '50%', y: '35%' },
                    origin: { x: 0.5, y: 0.5 },
                    style: {
                        fontFamily: 'Arial Black',
                        fontSize: '72px',
                        color: '#ff4444',
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
                    depth: 2
                },
                deathIcon: {
                    type: 'text',
                    text: '💀',
                    position: { x: '50%', y: '50%' },
                    origin: { x: 0.5, y: 0.5 },
                    style: {
                        fontSize: '96px'
                    },
                    depth: 1
                },
                restartButton: {
                    type: 'button',
                    text: '🔄 RESTART',
                    position: { x: '35%', y: '65%' },
                    scale: 1,
                    textStyle: {
                        fontFamily: 'Arial Black',
                        fontSize: '28px',
                        color: '#ffffff',
                        stroke: '#000000',
                        strokeThickness: 5
                    },
                    onClick: () => this.restartGame(),
                    hoverScale: 1.1,
                    clickScale: 0.95,
                    depth: 3
                },
                menuButton: {
                    type: 'button',
                    text: '🏠 MAIN MENU',
                    position: { x: '65%', y: '65%' },
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
                    depth: 3
                },
                instructions: {
                    type: 'text',
                    text: 'Press SPACE to restart • ESC for main menu',
                    position: { x: '50%', y: '80%' },
                    origin: { x: 0.5, y: 0.5 },
                    style: {
                        fontFamily: 'Arial',
                        fontSize: '18px',
                        color: '#999999',
                        align: 'center'
                    },
                    depth: 2
                },
                tipText: {
                    type: 'text',
                    text: this.getRandomTip(),
                    position: { x: '50%', y: '90%' },
                    origin: { x: 0.5, y: 0.5 },
                    style: {
                        fontFamily: 'Arial',
                        fontSize: '16px',
                        color: '#666666',
                        fontStyle: 'italic',
                        align: 'center'
                    },
                    depth: 2
                }
            }
        };

        this.uiManager = new UIManager(this, uiConfig);
        this.uiManager.createUI();

        // Scale background to cover screen
        const background = this.uiManager.getElement('background');
        if (background) {
            const screenSize = this.uiManager.getScreenSize();
            const bgScale = Math.max(
                screenSize.width / 1024,
                screenSize.height / 768
            );
            background.setScale(bgScale);
        }

        // Animate game over text with shake effect
        this.uiManager.animateElement('gameOverText', {
            scale: { from: 0, to: this.uiManager.getScale() },
            alpha: { from: 0, to: 1 },
            duration: 500,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Add shake effect
                this.uiManager.animateElement('gameOverText', {
                    x: '+=10',
                    duration: 50,
                    yoyo: true,
                    repeat: 5
                });
            }
        });

        // Animate death icon rotation
        this.uiManager.animateElement('deathIcon', {
            scale: { from: 2, to: this.uiManager.getScale() },
            rotation: { from: 0, to: Math.PI * 2 },
            alpha: { from: 0, to: 0.8 },
            duration: 1000,
            delay: 300,
            ease: 'Bounce.easeOut'
        });

        // Animate buttons fade in (no sliding)
        this.uiManager.animateElement('restartButton', {
            scale: { from: 0, to: this.uiManager.getScale() },
            alpha: { from: 0, to: 1 },
            duration: 400,
            delay: 600,
            ease: 'Back.easeOut'
        });

        this.uiManager.animateElement('menuButton', {
            scale: { from: 0, to: this.uiManager.getScale() },
            alpha: { from: 0, to: 1 },
            duration: 400,
            delay: 700,
            ease: 'Back.easeOut'
        });

        // Fade in instructions and tip
        this.uiManager.animateElement('instructions', {
            alpha: { from: 0, to: 1 },
            duration: 800,
            delay: 900
        });

        this.uiManager.animateElement('tipText', {
            alpha: { from: 0, to: 1 },
            duration: 800,
            delay: 1100
        });

        // Setup keyboard shortcuts
        const spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        spaceKey?.once('down', () => this.restartGame());
        
        const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        escKey?.once('down', () => this.returnToMenu());
        
        // Add fullscreen button for mobile devices
        if (DeviceDetector.isMobile() && DeviceDetector.isFullscreenSupported()) {
            FullscreenManager.getInstance().createFullscreenButton(this);
        }
    }

    private getRandomTip(): string {
        const tips = [
            '💡 Tip: Jump on enemies to defeat them!',
            '💡 Tip: Collect all keys before reaching the goal!',
            '💡 Tip: Hold jump for a higher jump!',
            '💡 Tip: Some blocks can be destroyed with bullets!',
            '💡 Tip: Wall jump to reach higher platforms!',
            '💡 Tip: Watch out for moving hazards!',
            '💡 Tip: Push boxes to create new paths!',
            '💡 Tip: Double jump can save you from falling!'
        ];
        return tips[Math.floor(Math.random() * tips.length)];
    }

    private restartGame(): void {
        // Emit scene change event
        eventBus.emit(GameEvent.SCENE_CHANGE, {
            from: 'GameOver',
            to: 'Game'
        });
        
        // Re-add and start a fresh Game scene
        this.scene.add('Game', Game, false);
        this.scene.start('Game');
        this.scene.stop('GameOver');
        
        // Clean up UI
        this.uiManager.destroy();
    }

    private returnToMenu(): void {
        // Emit scene change event
        eventBus.emit(GameEvent.SCENE_CHANGE, {
            from: 'GameOver',
            to: 'MainMenu'
        });
        
        this.scene.start('MainMenu');
        this.scene.stop('GameOver');
        
        // Clean up UI
        this.uiManager.destroy();
    }
}
