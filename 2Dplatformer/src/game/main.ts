import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { Victory } from './scenes/Victory';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';
// AudioManager 将在 Preloader 中初始化，这里不需要导入
import { URLParameterManager } from './utils/URLParameterManager';
import { extendLoader } from './resourceManager/LoaderExtensions';

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%'
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        MainGame,
        GameOver,
        Victory
    ],
    physics: {
        default: "arcade",
        arcade: {
            gravity: {x: 0, y: 1400},
            debug: false
        }
    }
};

const StartGame = (parent: string) => {
    // 扩展Phaser加载器
    extendLoader();
    
    // 获取URL参数管理器
    const urlParams = URLParameterManager.getInstance();
    
    // 根据URL参数调整游戏配置
    const gameConfig = { ...config };
    
    // 如果URL参数中指定了调试模式，启用物理调试
    if (urlParams.isDebugMode()) {
        if (gameConfig.physics?.arcade) {
            gameConfig.physics.arcade.debug = true;
        }
    }
    
    const game = new Game({ ...gameConfig, parent });
    
    // AudioManager 将在 Preloader 中初始化
    // 这里不需要额外的初始化，因为 AudioManager 是单例且会在 Preloader 中完成设置
    
    return game;
}

export default StartGame;
