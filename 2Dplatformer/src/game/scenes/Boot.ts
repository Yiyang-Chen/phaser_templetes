import { Scene } from 'phaser';
import { URLParameterManager } from '../utils/URLParameterManager';

export class Boot extends Scene
{
    private urlParams: URLParameterManager;

    constructor ()
    {
        super('Boot');
        this.urlParams = URLParameterManager.getInstance();
    }

    preload ()
    {
        //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
        //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.

        this.load.image('background', 'assets/bg.png');
    }

    create ()
    {
        // 处理URL参数
        this.handleURLParameters();
        
        this.scene.start('Preloader');
    }

    /**
     * 处理URL参数
     */
    private handleURLParameters(): void {
        // 调试模式
        if (this.urlParams.isDebugMode()) {
            // 安全地设置物理调试模式
            if (this.game.config.physics && 'arcade' in this.game.config.physics && this.game.config.physics.arcade) {
                this.game.config.physics.arcade.debug = true;
            }
            this.registry.set('debugMode', true);
            console.log('[Boot] 调试模式已启用');
        }
        
        // 关卡选择
        if (this.urlParams.hasLevel()) {
            const selectedLevel = this.urlParams.getLevel();
            this.registry.set('selectedLevel', selectedLevel);
            console.log(`[Boot] 设置关卡: ${selectedLevel}`);
        }
    }
}
