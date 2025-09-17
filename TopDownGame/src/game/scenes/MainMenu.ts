import { Scene, GameObjects } from 'phaser';
import { Game } from './Game';

export class MainMenu extends Scene
{
    background: GameObjects.Image;
    title: GameObjects.Text;
    subtitle: GameObjects.Text;
    playButton: GameObjects.Text;
    instructions: GameObjects.Text;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        // 设置地下城风格的深色背景
        this.cameras.main.setBackgroundColor(0x1a1a2e); // 深蓝紫色
        
        this.background = this.add.image(512, 384, 'background');
        
        // 缩放背景以覆盖整个屏幕，并降低透明度营造氛围
        const scaleX = this.cameras.main.width / this.background.width;
        const scaleY = this.cameras.main.height / this.background.height;
        const scale = Math.max(scaleX, scaleY);
        this.background.setScale(scale);
        this.background.setAlpha(0.3); // 降低背景图透明度，突出深色主题

        // 主标题 - 调整位置，因为去掉了logo
        this.title = this.add.text(512, 250, 'DUNGEON ADVENTURE', {
            fontFamily: 'Arial Black', 
            fontSize: '48px', 
            color: '#ffffff',
            stroke: '#000000', 
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        // 副标题
        this.subtitle = this.add.text(512, 320, '⚔️ A Knight\'s Quest Through the Depths ⚔️', {
            fontFamily: 'Arial', 
            fontSize: '24px', 
            color: '#FFD700',
            stroke: '#000000', 
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5);

        // PLAY按钮
        this.playButton = this.add.text(512, 420, 'PLAY', {
            fontFamily: 'Arial Black', 
            fontSize: '32px', 
            color: '#ffffff',
            stroke: '#000000', 
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
            this.playButton.setScale(1.1);
            this.playButton.setTint(0xffff00);
        })
        .on('pointerout', () => {
            this.playButton.setScale(1.0);
            this.playButton.clearTint();
        })
        .on('pointerdown', () => {
            this.playButton.setScale(0.95);
        })
        .on('pointerup', () => {
            this.playButton.setScale(1.1);
            this.startGame();
        });

        // 操作说明
        this.instructions = this.add.text(512, 500, 'Click PLAY or press any key to start\nWASD/Arrow Keys to move • SPACE to shoot', {
            fontFamily: 'Arial', 
            fontSize: '18px', 
            color: '#cccccc',
            align: 'center'
        }).setOrigin(0.5);

        // 添加地下城风格装饰
        this.createDungeonDecorations();

        // 设置自定义鼠标光标
        this.setupCustomCursor();

        // 添加动画效果
        this.createAnimations();

        // 键盘输入启动游戏
        this.input.keyboard?.once('keydown', () => {
            this.startGame();
        });
    }
    
    private setupCustomCursor(): void {
        // 通过Canvas的style属性直接使用crosshair图像作为CSS光标
        const canvas = this.sys.game.canvas;
        
        // 先将图像转换为Data URL用作CSS光标
        const crosshairTexture = this.textures.get('crosshair');
        const crosshairFrame = crosshairTexture.getSourceImage() as HTMLImageElement;
        
        // 创建一个临时canvas来处理图像
        const tempCanvas = document.createElement('canvas');
        const tempContext = tempCanvas.getContext('2d');
        tempCanvas.width = crosshairFrame.width || 16;
        tempCanvas.height = crosshairFrame.height || 16;
        
        // 绘制图像到临时canvas
        if (tempContext) {
            tempContext.drawImage(crosshairFrame, 0, 0);
        }
        
        // 获取Data URL
        const dataURL = tempCanvas.toDataURL();
        
        // 设置CSS光标，hotspot设置在图像中心
        const centerX = Math.floor(tempCanvas.width / 2);
        const centerY = Math.floor(tempCanvas.height / 2);
        canvas.style.cursor = `url('${dataURL}') ${centerX} ${centerY}, crosshair`;
        

    }

    private createDungeonDecorations(): void {
        // 创建火把效果
        const torch1 = this.add.circle(150, 200, 8, 0xff6600, 0.8);
        const torch2 = this.add.circle(this.cameras.main.width - 150, 200, 8, 0xff6600, 0.8);
        
        // 火把闪烁动画
        this.tweens.add({
            targets: [torch1, torch2],
            alpha: { from: 0.5, to: 1 },
            scale: { from: 0.8, to: 1.2 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 添加装饰性边框
        const borderGraphics = this.add.graphics();
        borderGraphics.lineStyle(4, 0x8B4513, 0.8); // 棕色边框
        borderGraphics.strokeRoundedRect(50, 50, this.cameras.main.width - 100, this.cameras.main.height - 100, 20);
        borderGraphics.setDepth(-1);

        // 添加底部装饰石块
        for (let i = 0; i < 8; i++) {
            const x = (this.cameras.main.width / 8) * i + (this.cameras.main.width / 16);
            const y = this.cameras.main.height - 30;
            const stone = this.add.rectangle(x, y, 40, 20, 0x696969, 0.6);
            stone.setDepth(-1);
            
            // 轻微浮动动画
            this.tweens.add({
                targets: stone,
                y: y + 3,
                duration: 2000 + i * 200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // 添加角落装饰
        const cornerSize = 40;
        const corners = [
            this.add.triangle(cornerSize, cornerSize, 0, 0, cornerSize, 0, 0, cornerSize, 0x4a4a4a, 0.7),
            this.add.triangle(this.cameras.main.width - cornerSize, cornerSize, 0, 0, cornerSize, 0, cornerSize, cornerSize, 0x4a4a4a, 0.7),
            this.add.triangle(cornerSize, this.cameras.main.height - cornerSize, 0, 0, 0, cornerSize, cornerSize, cornerSize, 0x4a4a4a, 0.7),
            this.add.triangle(this.cameras.main.width - cornerSize, this.cameras.main.height - cornerSize, 0, cornerSize, cornerSize, 0, cornerSize, cornerSize, 0x4a4a4a, 0.7)
        ];

        corners.forEach(corner => corner.setDepth(-1));
    }

    private createAnimations(): void {
        // 标题入场动画
        this.title.setScale(0);
        this.title.setAlpha(0);
        this.tweens.add({
            targets: this.title,
            scale: 1,
            alpha: 1,
            duration: 800,
            delay: 200,
            ease: 'Back.easeOut'
        });

        // 副标题淡入动画
        this.subtitle.setAlpha(0);
        this.tweens.add({
            targets: this.subtitle,
            alpha: 1,
            duration: 600,
            delay: 400,
            ease: 'Power2.easeOut'
        });

        // PLAY按钮入场动画
        this.playButton.setScale(0);
        this.playButton.setAlpha(0);
        this.tweens.add({
            targets: this.playButton,
            scale: 1,
            alpha: 1,
            duration: 500,
            delay: 600,
            ease: 'Back.easeOut'
        });

        // 说明文字淡入
        this.instructions.setAlpha(0);
        this.tweens.add({
            targets: this.instructions,
            alpha: 1,
            duration: 1000,
            delay: 800
        });

        // 标题闪烁效果
        this.time.delayedCall(2000, () => {
            this.tweens.add({
                targets: this.title,
                alpha: 0.7,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });
    }

    private startGame(): void {
        // 停止所有动画
        this.tweens.killAll();
        
        // 淡出效果
        this.cameras.main.fadeOut(500, 0, 0, 0);
        
        this.cameras.main.once('camerafadeoutcomplete', () => {
            // Re-add and start a fresh Game scene
            this.scene.add('Game', Game, false);
            this.scene.start('Game');
        });
    }
}
