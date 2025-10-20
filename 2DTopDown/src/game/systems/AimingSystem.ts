import Phaser from 'phaser';

/**
 * 瞄准系统 - TopDown游戏鼠标瞄准
 * 
 * 功能：
 * - 计算从精灵到鼠标的方向向量
 * - 旋转精灵朝向鼠标
 * - 提供射击方向
 */
export class AimingSystem {
    private static instance: AimingSystem;
    
    private constructor() {}
    
    static getInstance(): AimingSystem {
        if (!AimingSystem.instance) {
            AimingSystem.instance = new AimingSystem();
        }
        return AimingSystem.instance;
    }
    
    /**
     * 获取从精灵到鼠标的方向向量（归一化）
     * @param sprite 源精灵
     * @param pointer 鼠标指针
     * @returns 归一化的方向向量 {x, y}
     */
    getDirectionToPointer(sprite: Phaser.GameObjects.Sprite, pointer: Phaser.Input.Pointer): { x: number, y: number } {
        // 获取鼠标的世界坐标（考虑相机滚动）
        const worldX = pointer.worldX;
        const worldY = pointer.worldY;
        
        // 计算方向向量
        const dx = worldX - sprite.x;
        const dy = worldY - sprite.y;
        
        // 归一化
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length === 0) {
            return { x: 1, y: 0 }; // 默认向右
        }
        
        return {
            x: dx / length,
            y: dy / length
        };
    }
    
    /**
     * 获取从精灵到鼠标的角度（弧度）
     * @param sprite 源精灵
     * @param pointer 鼠标指针
     * @returns 角度（弧度）
     */
    getAngleToPointer(sprite: Phaser.GameObjects.Sprite, pointer: Phaser.Input.Pointer): number {
        const worldX = pointer.worldX;
        const worldY = pointer.worldY;
        
        const dx = worldX - sprite.x;
        const dy = worldY - sprite.y;
        
        return Math.atan2(dy, dx);
    }
    
    /**
     * 旋转精灵朝向鼠标
     * @param sprite 要旋转的精灵
     * @param pointer 鼠标指针
     * @param offsetAngle 角度偏移（弧度），默认0
     */
    rotateToPointer(sprite: Phaser.GameObjects.Sprite, pointer: Phaser.Input.Pointer, offsetAngle: number = 0): void {
        const angle = this.getAngleToPointer(sprite, pointer);
        sprite.setRotation(angle + offsetAngle);
    }
    
    /**
     * 翻转精灵朝向鼠标（不旋转，只左右翻转）
     * TopDown游戏常用：玩家精灵不旋转，只翻转面向鼠标方向
     * @param sprite 要翻转的精灵
     * @param pointer 鼠标指针
     */
    flipToPointer(sprite: Phaser.GameObjects.Sprite, pointer: Phaser.Input.Pointer): void {
        const worldX = pointer.worldX;
        const dx = worldX - sprite.x;
        
        // 鼠标在左边时flipX=true，在右边时flipX=false
        sprite.setFlipX(dx < 0);
    }
    
    /**
     * 计算两点之间的距离
     * @param x1 起点X
     * @param y1 起点Y
     * @param x2 终点X
     * @param y2 终点Y
     * @returns 距离
     */
    getDistance(x1: number, y1: number, x2: number, y2: number): number {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * 检查鼠标是否在精灵范围内
     * @param sprite 精灵
     * @param pointer 鼠标指针
     * @param radius 检测半径
     * @returns 是否在范围内
     */
    isPointerNearSprite(sprite: Phaser.GameObjects.Sprite, pointer: Phaser.Input.Pointer, radius: number): boolean {
        const worldX = pointer.worldX;
        const worldY = pointer.worldY;
        const distance = this.getDistance(sprite.x, sprite.y, worldX, worldY);
        return distance <= radius;
    }
}

