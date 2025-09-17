import { Scene } from 'phaser';
import { Game } from './Game';

export class GameOver extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameover_text : Phaser.GameObjects.Text;

    constructor ()
    {
        super('GameOver');
    }

    create ()
    {
        this.camera = this.cameras.main
        this.camera.setBackgroundColor(0x2c2c2c);

        this.background = this.add.image(512, 384, 'background');
        this.background.setAlpha(0.5);

        this.gameover_text = this.add.text(512, 320, 'Game Over', {
            fontFamily: 'Arial Black', fontSize: 64, color: '#ff4444',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        });
        this.gameover_text.setOrigin(0.5);
        
        const restartText = this.add.text(512, 420, 'Click to Restart', {
            fontFamily: 'Arial', fontSize: 24, color: '#ffffff',
            stroke: '#000000', strokeThickness: 4,
            align: 'center'
        });
        restartText.setOrigin(0.5);
        
        const menuText = this.add.text(512, 480, 'Press ESC to Return to Main Menu', {
            fontFamily: 'Arial', fontSize: 20, color: '#aaaaaa',
            stroke: '#000000', strokeThickness: 3,
            align: 'center'
        });
        menuText.setOrigin(0.5);

        this.input.once('pointerdown', () => {
            // Re-add and start a fresh Game scene
            this.scene.add('Game', Game, false);
            this.scene.start('Game');
            this.scene.stop('GameOver');
        });
        
        // ESC key to return to main menu
        const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        escKey?.once('down', () => {
            this.scene.start('MainMenu');
            this.scene.stop('GameOver');
        });
    }
}
