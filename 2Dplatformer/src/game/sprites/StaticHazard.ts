import { Scene } from 'phaser';
import { AnimationManager } from '../managers/AnimationManager';

export class StaticHazard extends Phaser.Physics.Arcade.Sprite {
    private damage: number;
    private hazardType: string;
    private animationManager: AnimationManager;

    constructor(scene: Scene, hazardObject: Phaser.Types.Tilemaps.TiledObject) {
        const x = hazardObject.x || 0;
        const y = hazardObject.y || 0;
        const height = hazardObject.height || 64;
        const texture = hazardObject.name || 'hazard';
        
        // Convert Tiled bottom coordinate to Phaser center coordinate
        super(scene, x, y - height / 2, texture);
        
        scene.add.existing(this);
        scene.physics.add.existing(this, true);
        
        this.setOrigin(0.5, 0.5);
        this.animationManager = AnimationManager.getInstance();
        
        const properties = hazardObject.properties as any;
        this.damage = properties?.damage || 1;
        this.hazardType = hazardObject.name || 'generic';
        
        this.setSize(48, 48);
        this.setOffset(8, 16);
        
        if (this.body && typeof this.body.updateFromGameObject === 'function') {
            (this.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
        }
        
        // Try to play idle animation
        this.tryPlayIdleAnimation();
    }

    getDamage(): number {
        return this.damage;
    }

    getHazardType(): string {
        return this.hazardType;
    }
    
    private tryPlayIdleAnimation(): void {
        const atlasKey = this.hazardType;
        
        // First check if animations exist for this atlas/texture
        if (this.animationManager.hasAnimation(atlasKey, 'idle')) {
            this.animationManager.playAnimation(this, atlasKey, 'idle');
        } else {
            // Try to create animations if they don't exist
            this.animationManager.createAnimationsForAtlas(atlasKey);
            
            // Check again after attempting to create
            if (this.animationManager.hasAnimation(atlasKey, 'idle')) {
                this.animationManager.playAnimation(this, atlasKey, 'idle');
            }
        }
    }
}