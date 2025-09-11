import { Scene } from 'phaser';
import { URLParameterManager, URL_PARAMS } from '../utils/URLParameterManager';

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
        if (this.urlParams.getBoolean(URL_PARAMS.DEBUG)) {
            console.log('🐛 调试模式已启用');
            this.game.config.physics?.arcade && (this.game.config.physics.arcade.debug = true);
        }

        // 跳过介绍
        if (this.urlParams.getBoolean(URL_PARAMS.SKIP_INTRO)) {
            console.log('⏭️ 跳过介绍动画');
            this.registry.set('skipIntro', true);
        }

        // 设置游戏难度
        const difficulty = this.urlParams.getString(URL_PARAMS.DIFFICULTY, 'normal');
        this.registry.set('difficulty', difficulty);
        console.log(`🎯 游戏难度: ${difficulty}`);

        // 设置关卡
        const level = this.urlParams.getNumber(URL_PARAMS.LEVEL, 1);
        this.registry.set('startLevel', level);
        console.log(`🏁 起始关卡: ${level}`);

        // 设置玩家名称
        const playerName = this.urlParams.getString(URL_PARAMS.PLAYER_NAME, 'Player');
        this.registry.set('playerName', playerName);
        console.log(`👤 玩家名称: ${playerName}`);

        // 音效设置
        const soundEnabled = this.urlParams.getBoolean(URL_PARAMS.SOUND, true);
        this.registry.set('soundEnabled', soundEnabled);
        console.log(`🔊 音效: ${soundEnabled ? '开启' : '关闭'}`);

        // 音乐设置
        const musicEnabled = this.urlParams.getBoolean(URL_PARAMS.MUSIC, true);
        this.registry.set('musicEnabled', musicEnabled);
        console.log(`🎵 音乐: ${musicEnabled ? '开启' : '关闭'}`);

        // 全屏模式
        const fullscreen = this.urlParams.getBoolean(URL_PARAMS.FULLSCREEN, false);
        if (fullscreen) {
            console.log('🖥️ 自动进入全屏模式');
            this.registry.set('autoFullscreen', true);
        }

        // 上帝模式（开发用）
        if (this.urlParams.getBoolean(URL_PARAMS.GOD_MODE)) {
            console.log('👑 上帝模式已启用');
            this.registry.set('godMode', true);
        }

        // 无限生命（开发用）
        if (this.urlParams.getBoolean(URL_PARAMS.UNLIMITED_LIVES)) {
            console.log('💖 无限生命已启用');
            this.registry.set('unlimitedLives', true);
        }

        // 显示所有参数
        const allParams = this.urlParams.getAll();
        if (Object.keys(allParams).length > 0) {
            console.log('📋 所有URL参数:', allParams);
        }
    }
}
