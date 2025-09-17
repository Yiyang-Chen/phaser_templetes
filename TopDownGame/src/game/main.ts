import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
// import { Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { Victory } from './scenes/Victory';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#2d5a27', // 改为深绿色，适合地下城主题
    scene: [
        Boot,
        Preloader,
        MainMenu,
        GameOver,
        Victory
    ],
    physics: {
        default: "arcade",
        arcade: {
            gravity: {x: 0, y: 0}, // 移除重力，改为俯视角
            debug: false
        }
    }
};

const StartGame = (parent: string) => {

    return new Game({ ...config, parent });

}

export default StartGame;
