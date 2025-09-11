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
        
        // 将URL参数管理器传递给游戏数据
        this.registry.set('urlParams', this.urlParams);
        
        this.scene.start('Preloader');
    }

    /**
     * 处理URL参数
     */
    private handleURLParameters(): void {
        // 调试模式
        if (this.urlParams.isDebugMode()) {
            console.log('🐛 调试模式已启用');
            this.game.config.physics?.arcade && (this.game.config.physics.arcade.debug = true);
            this.registry.set('debugMode', true);
        }
    }
}
