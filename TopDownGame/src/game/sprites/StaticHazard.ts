import { Scene } from 'phaser';

export class StaticHazard extends Phaser.Physics.Arcade.Sprite {
    private damage: number;
    private hazardType: string;

    constructor(scene: Scene, hazardObject: Phaser.Types.Tilemaps.TiledObject) {
        const x = hazardObject.x || 0;
        const y = hazardObject.y || 0;
        const texture = hazardObject.name || 'hazard';
        
        super(scene, x, y - 32, texture);
        
        scene.add.existing(this);
        scene.physics.add.existing(this, true);
        
        this.setOrigin(0.5, 0.5);
        
        const properties = hazardObject.properties as any;
        this.damage = properties?.damage || 1;
        this.hazardType = hazardObject.name || 'generic';
        
        this.setSize(48, 48);
        this.setOffset(8, 16);
        
        if (this.body && typeof this.body.updateFromGameObject === 'function') {
            (this.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
        }
    }

    getDamage(): number {
        return this.damage;
    }

    getHazardType(): string {
        return this.hazardType;
    }
}