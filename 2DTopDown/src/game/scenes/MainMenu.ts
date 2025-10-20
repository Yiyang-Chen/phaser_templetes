import { Scene } from 'phaser';
import { eventBus, GameEvent } from '../events/EventBus';
import { UIManager, UILayoutConfig } from '../managers/UIManager';
import { DeviceDetector } from '../utils/DeviceDetector';
import { FullscreenManager } from '../managers/FullscreenManager';
import { AudioManager } from '../audio/AudioManager';

export class MainMenu extends Scene
{
    private uiManager: UIManager;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
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
                    depth: 0
                },
                title: {
                    type: 'text',
                    text: 'PLATFORM ADVENTURE',
                    position: { x: '50%', y: '35%' },
                    origin: { x: 0.5, y: 0.5 },
                    style: {
                        fontFamily: 'Arial Black',
                        fontSize: '48px',
                        color: '#ffffff',
                        stroke: '#000000',
                        strokeThickness: 8,
                        align: 'center'
                    },
                    depth: 2
                },
                subtitle: {
                    type: 'text',
                    text: '🎮 A Challenging Platformer Game 🎮',
                    position: { x: '50%', y: '45%' },
                    origin: { x: 0.5, y: 0.5 },
                    style: {
                        fontFamily: 'Arial',
                        fontSize: '24px',
                        color: '#FFD700',
                        stroke: '#000000',
                        strokeThickness: 4,
                        align: 'center'
                    },
                    depth: 2
                },
                playButton: {
                    type: 'button',
                    text: 'PLAY',
                    position: { x: '50%', y: '60%' },
                    scale: 1,
                    textStyle: {
                        fontFamily: 'Arial Black',
                        fontSize: '32px',
                        color: '#ffffff',
                        stroke: '#000000',
                        strokeThickness: 6
                    },
                    onClick: () => this.startGame(),
                    hoverScale: 1.1,
                    clickScale: 0.95,
                    depth: 3
                },
                instructions: {
                    type: 'text',
                    text: 'Click PLAY or press any key to start',
                    position: { x: '50%', y: '75%' },
                    origin: { x: 0.5, y: 0.5 },
                    style: {
                        fontFamily: 'Arial',
                        fontSize: '18px',
                        color: '#cccccc',
                        align: 'center'
                    },
                    depth: 2
                }
            }
        };

        this.uiManager = new UIManager(this, uiConfig);
        this.uiManager.createUI();

        // Scale background to cover screen
        const background = this.uiManager.getElement('background') as Phaser.GameObjects.Image;
        if (background) {
            const screenSize = this.uiManager.getScreenSize();
            const bgScale = Math.max(
                screenSize.width / 1024,
                screenSize.height / 768
            );
            background.setScale(bgScale);
        }

        // Animate title entrance
        this.uiManager.animateElement('title', {
            scale: { from: 0, to: this.uiManager.getScale() },
            alpha: { from: 0, to: 1 },
            duration: 800,
            delay: 200,
            ease: 'Back.easeOut'
        });

        // Animate subtitle entrance
        this.uiManager.animateElement('subtitle', {
            alpha: { from: 0, to: 1 },
            duration: 600,
            delay: 400,
            ease: 'Power2.easeOut'
        });

        // Animate play button entrance
        this.uiManager.animateElement('playButton', {
            scale: { from: 0, to: this.uiManager.getScale() },
            alpha: { from: 0, to: 1 },
            duration: 500,
            delay: 600,
            ease: 'Back.easeOut'
        });

        // Fade in instructions
        this.uiManager.animateElement('instructions', {
            alpha: { from: 0, to: 1 },
            duration: 1000,
            delay: 800
        });

        // Emit scene start event
        eventBus.emit(GameEvent.SCENE_START, {
            scene: 'MainMenu'
        });

        // Allow keyboard input to start game
        this.input.keyboard?.once('keydown', () => {
            this.startGame();
        });
        
        // Add fullscreen button for mobile devices
        if (DeviceDetector.isMobile() && DeviceDetector.isFullscreenSupported()) {
            FullscreenManager.getInstance().createFullscreenButton(this);
        }
        
        // 启动音频后台加载
        console.log('🎵 MainMenu: 启动音频后台加载...');
        AudioManager.getInstance().startBackgroundLoading();
    }

    private startGame(): void {
        console.log('🎮 MainMenu: startGame() 被调用');
        
        // Emit scene change event
        eventBus.emit(GameEvent.SCENE_CHANGE, {
            from: 'MainMenu',
            to: 'Game'
        });
        
        console.log('🎮 MainMenu: 准备启动Game场景');
        
        // Start the Game scene (it's already registered in main.ts)
        this.scene.start('Game');
        
        console.log('🎮 MainMenu: Game场景启动命令已发送');
        
        // Clean up UI
        this.uiManager.destroy();
    }
}
