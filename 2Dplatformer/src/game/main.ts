import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
// import { Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { Victory } from './scenes/Victory';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';
import { BGMPlayer } from './managers/BGMPlayer';

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
        GameOver,
        Victory
    ],
    physics: {
        default: "arcade",
        arcade: {
            gravity: {x: 0, y: 600},
            debug: false
        }
    }
};

const StartGame = (parent: string) => {
    const game = new Game({ ...config, parent });
    
    // Initialize BGMPlayer with the game instance
    BGMPlayer.getInstance().initialize(game);
    
    return game;
}

export default StartGame;
